<?php
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

const VST_SESSION_IDLE_TIMEOUT = 7200; // 2 horas sem atividade.
const VST_LOGIN_WINDOW = 60;          // Janela de tentativas de login.
const VST_LOGIN_MAX_FAILURES = 5;     // Máximo de falhas na janela.

if (session_status() !== PHP_SESSION_ACTIVE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    session_name('VSTSESSID');

    session_set_cookie_params([
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    ]);

    session_start();
}

require_once __DIR__ . '/../config/conexao.php';

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);

    if (!is_array($data)) {
        jsonResponse(['ok' => false, 'message' => 'JSON inválido.'], 400);
    }

    return $data;
}

function requestMethod(): string
{
    return strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

function enforceSameOriginForWriteRequests(): void
{
    $method = requestMethod();

    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));

    // Navegadores enviam Origin nas requisições fetch() do sistema.
    // Caso a requisição venha de ferramenta local sem Origin, ela é aceita.
    if ($origin === '') {
        return;
    }

    $originParts = parse_url($origin);

    if (!is_array($originParts) || empty($originParts['host'])) {
        jsonResponse(['ok' => false, 'message' => 'Origem da requisição inválida.'], 403);
    }

    $requestHostRaw = (string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '');
    $requestParts = parse_url('http://' . $requestHostRaw);

    $originHost = strtolower((string)($originParts['host'] ?? ''));
    $requestHost = strtolower((string)($requestParts['host'] ?? ''));

    $originScheme = strtolower((string)($originParts['scheme'] ?? 'http'));
    $requestScheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        ? 'https'
        : 'http';

    $originPort = (int)($originParts['port'] ?? ($originScheme === 'https' ? 443 : 80));
    $requestPort = (int)($requestParts['port'] ?? ($requestScheme === 'https' ? 443 : 80));

    if (
        $originHost === ''
        || $requestHost === ''
        || $originHost !== $requestHost
        || $originPort !== $requestPort
    ) {
        jsonResponse(['ok' => false, 'message' => 'Requisição bloqueada por origem inválida.'], 403);
    }
}

function destroyCurrentSession(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            [
                'expires' => time() - 42000,
                'path' => $params['path'] ?: '/',
                'domain' => $params['domain'] ?? '',
                'secure' => (bool)($params['secure'] ?? false),
                'httponly' => (bool)($params['httponly'] ?? true),
                'samesite' => $params['samesite'] ?? 'Lax',
            ]
        );
    }

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function currentUserIdOrNull(bool $touch = true): ?int
{
    $id = $_SESSION['usuario_id'] ?? null;

    if (!$id) {
        return null;
    }

    $now = time();
    $lastActivity = (int)($_SESSION['ultima_atividade'] ?? 0);

    if (
        $lastActivity > 0
        && ($now - $lastActivity) > VST_SESSION_IDLE_TIMEOUT
    ) {
        destroyCurrentSession();
        return null;
    }

    if ($touch) {
        $_SESSION['ultima_atividade'] = $now;
    }

    return (int)$id;
}

function establishAuthenticatedSession(int $userId, string $userName): void
{
    session_regenerate_id(true);

    $_SESSION['usuario_id'] = $userId;
    $_SESSION['usuario_nome'] = $userName;
    $_SESSION['ultima_atividade'] = time();

    unset(
        $_SESSION['login_failures']
    );
}

function requireAuth(): int
{
    $id = currentUserIdOrNull();

    if (!$id) {
        jsonResponse(
            ['ok' => false, 'message' => 'Sessão expirada ou usuário não autenticado.'],
            401
        );
    }

    return $id;
}

function normalizeString(mixed $value, int $max = 255): string
{
    $text = trim((string)($value ?? ''));

    if (function_exists('mb_substr')) {
        return mb_substr($text, 0, $max);
    }

    return substr($text, 0, $max);
}

function nullableString(mixed $value, int $max = 255): ?string
{
    $text = normalizeString($value, $max);
    return $text === '' ? null : $text;
}

function msFromSqlDate(?string $value): int
{
    if (!$value) {
        return 0;
    }

    $ts = strtotime($value);
    return $ts === false ? 0 : $ts * 1000;
}

function sqlDateTimeFromMs(mixed $value): string
{
    $ms = (int)($value ?? 0);

    if ($ms <= 0) {
        return date('Y-m-d H:i:s');
    }

    return date('Y-m-d H:i:s', (int)floor($ms / 1000));
}

function frontDateToSql(mixed $value): string
{
    $text = trim((string)($value ?? ''));

    if ($text === '') {
        return date('Y-m-d');
    }

    $br = DateTime::createFromFormat('!d/m/Y', $text);

    if ($br && $br->format('d/m/Y') === $text) {
        return $br->format('Y-m-d');
    }

    $sql = DateTime::createFromFormat('!Y-m-d', $text);

    if ($sql && $sql->format('Y-m-d') === $text) {
        return $sql->format('Y-m-d');
    }

    return date('Y-m-d');
}

function sqlDateToFront(mixed $value): string
{
    $text = trim((string)($value ?? ''));
    $date = DateTime::createFromFormat('!Y-m-d', $text);

    return $date ? $date->format('d/m/Y') : $text;
}

function validFrontId(mixed $value, string $prefix): string
{
    $id = normalizeString($value, 80);

    if ($id === '') {
        $id = $prefix . '-' . bin2hex(random_bytes(12));
    }

    return $id;
}

function activityInsert(
    PDO $pdo,
    int $userId,
    string $description,
    string $category,
    mixed $createdAt = null
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO atividades (id_usuario, descricao, categoria, criado_em) VALUES (?, ?, ?, ?)'
    );

    $stmt->execute([
        $userId,
        normalizeString($description, 255),
        normalizeString($category, 60),
        sqlDateTimeFromMs($createdAt),
    ]);
}

function loginFailuresInWindow(): array
{
    $now = time();
    $failures = $_SESSION['login_failures'] ?? [];

    if (!is_array($failures)) {
        $failures = [];
    }

    $failures = array_values(array_filter(
        $failures,
        static fn(mixed $timestamp): bool =>
            is_numeric($timestamp)
            && ($now - (int)$timestamp) < VST_LOGIN_WINDOW
    ));

    $_SESSION['login_failures'] = $failures;

    return $failures;
}

function enforceLoginRateLimit(): void
{
    $failures = loginFailuresInWindow();

    if (count($failures) < VST_LOGIN_MAX_FAILURES) {
        return;
    }

    $oldest = (int)min($failures);
    $retryAfter = max(1, VST_LOGIN_WINDOW - (time() - $oldest));

    header('Retry-After: ' . $retryAfter);

    jsonResponse([
        'ok' => false,
        'message' => "Muitas tentativas de login. Aguarde {$retryAfter} segundo(s) e tente novamente.",
        'retryAfter' => $retryAfter,
    ], 429);
}

function registerLoginFailure(): void
{
    $failures = loginFailuresInWindow();
    $failures[] = time();

    $_SESSION['login_failures'] = $failures;
}

function clearLoginFailures(): void
{
    unset($_SESSION['login_failures']);
}

enforceSameOriginForWriteRequests();
