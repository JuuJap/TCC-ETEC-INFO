<?php
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

ini_set('display_errors', '0');
ini_set('html_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

const VST_MOD_SESSION_IDLE_TIMEOUT = 7200;
const VST_MOD_LOGIN_WINDOW = 60;
const VST_MOD_LOGIN_MAX_FAILURES = 5;

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

require_once __DIR__ . '/../config/database.php';

function responder(array $dados, int $status = 200): never
{
    http_response_code($status);

    echo json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
        | JSON_PRESERVE_ZERO_FRACTION
    );

    exit;
}

function metodoAtual(): string
{
    return strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

function protegerOrigem(): void
{
    $metodo = metodoAtual();

    if (in_array($metodo, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));

    if ($origin === '') {
        return;
    }

    $originParts = parse_url($origin);
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
        responder(
            ['sucesso' => false, 'mensagem' => 'Requisição bloqueada por origem inválida.'],
            403
        );
    }
}

function entrada(): array
{
    if (!empty($_POST)) {
        return $_POST;
    }

    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $dados = json_decode($raw, true);

    if (!is_array($dados)) {
        responder(
            [
                'sucesso' => false,
                'mensagem' => 'O corpo da requisição não contém um JSON válido.'
            ],
            400
        );
    }

    return $dados;
}

function metodoPermitido(string ...$permitidos): string
{
    $metodo = metodoAtual();
    $permitidos = array_map('strtoupper', $permitidos);

    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));

        responder(
            ['sucesso' => false, 'mensagem' => 'Método HTTP não permitido.'],
            405
        );
    }

    return $metodo;
}

function limparSessao(): void
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

function usuarioAtual(): ?array
{
    if (
        empty($_SESSION['usuario_id'])
        || empty($_SESSION['usuario_nome'])
    ) {
        return null;
    }

    $agora = time();
    $ultimaAtividade = (int)($_SESSION['ultima_atividade'] ?? 0);

    if (
        $ultimaAtividade > 0
        && ($agora - $ultimaAtividade) > VST_MOD_SESSION_IDLE_TIMEOUT
    ) {
        limparSessao();
        return null;
    }

    $_SESSION['ultima_atividade'] = $agora;

    return [
        'id' => (int)$_SESSION['usuario_id'],
        'nome' => (string)$_SESSION['usuario_nome'],
    ];
}

function autenticarSessao(int $id, string $nome): void
{
    session_regenerate_id(true);

    $_SESSION['usuario_id'] = $id;
    $_SESSION['usuario_nome'] = $nome;
    $_SESSION['ultima_atividade'] = time();

    unset($_SESSION['login_failures']);
}

function exigirLogin(): array
{
    $usuario = usuarioAtual();

    if ($usuario === null) {
        responder(
            [
                'sucesso' => false,
                'autenticado' => false,
                'mensagem' => 'Faça login para continuar.'
            ],
            401
        );
    }

    return $usuario;
}

function falhasLoginRecentes(): array
{
    $agora = time();
    $falhas = $_SESSION['login_failures'] ?? [];

    if (!is_array($falhas)) {
        $falhas = [];
    }

    $falhas = array_values(array_filter(
        $falhas,
        static fn(mixed $timestamp): bool =>
            is_numeric($timestamp)
            && ($agora - (int)$timestamp) < VST_MOD_LOGIN_WINDOW
    ));

    $_SESSION['login_failures'] = $falhas;

    return $falhas;
}

function limitarTentativasLogin(): void
{
    $falhas = falhasLoginRecentes();

    if (count($falhas) < VST_MOD_LOGIN_MAX_FAILURES) {
        return;
    }

    $maisAntiga = (int)min($falhas);
    $restante = max(
        1,
        VST_MOD_LOGIN_WINDOW - (time() - $maisAntiga)
    );

    header('Retry-After: ' . $restante);

    responder(
        [
            'sucesso' => false,
            'mensagem' => "Muitas tentativas de login. Aguarde {$restante} segundo(s) e tente novamente.",
            'retryAfter' => $restante,
        ],
        429
    );
}

function registrarFalhaLogin(): void
{
    $falhas = falhasLoginRecentes();
    $falhas[] = time();

    $_SESSION['login_failures'] = $falhas;
}

function limparFalhasLogin(): void
{
    unset($_SESSION['login_failures']);
}

function texto(mixed $valor, int $maximo = 255): string
{
    $valor = trim((string)($valor ?? ''));

    if (function_exists('mb_substr')) {
        return mb_substr($valor, 0, $maximo, 'UTF-8');
    }

    return substr($valor, 0, $maximo);
}

function textoOuNull(mixed $valor, int $maximo = 255): ?string
{
    $valor = texto($valor, $maximo);
    return $valor === '' ? null : $valor;
}

function decimal(mixed $valor): float
{
    if (is_int($valor) || is_float($valor)) {
        return (float)$valor;
    }

    $texto = trim((string)($valor ?? ''));

    if ($texto === '') {
        return 0.0;
    }

    if (str_contains($texto, ',')) {
        $texto = str_replace('.', '', $texto);
        $texto = str_replace(',', '.', $texto);
    }

    return is_numeric($texto) ? (float)$texto : 0.0;
}

function milissegundos(?string $data): int
{
    if (!$data) {
        return 0;
    }

    $timestamp = strtotime($data);

    return $timestamp === false ? 0 : $timestamp * 1000;
}

function dataParaSql(mixed $valor): ?string
{
    $valor = texto($valor, 20);

    if ($valor === '') {
        return null;
    }

    foreach (['Y-m-d', 'd/m/Y'] as $formato) {
        $data = DateTime::createFromFormat('!' . $formato, $valor);

        if ($data && $data->format($formato) === $valor) {
            return $data->format('Y-m-d');
        }
    }

    return null;
}

function dataParaFront(?string $valor): string
{
    if (!$valor) {
        return '';
    }

    $data = DateTime::createFromFormat('!Y-m-d', $valor);

    return $data
        ? $data->format('d/m/Y')
        : $valor;
}

function registrarAtividade(
    PDO $pdo,
    ?int $usuarioId,
    string $descricao,
    string $categoria
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO atividades (id_usuario, descricao, categoria) VALUES (:usuario, :descricao, :categoria)'
    );

    $stmt->execute([
        ':usuario' => $usuarioId,
        ':descricao' => texto($descricao, 255),
        ':categoria' => texto($categoria, 60),
    ]);
}

function idClientePorNome(PDO $pdo, string $nome): ?int
{
    $stmt = $pdo->prepare(
        'SELECT id_cliente FROM clientes WHERE nome = :nome ORDER BY id_cliente LIMIT 1'
    );
    $stmt->execute([':nome' => $nome]);

    $id = $stmt->fetchColumn();

    return $id === false
        ? null
        : (int)$id;
}

function idProdutoPorNome(PDO $pdo, string $nome): ?int
{
    $stmt = $pdo->prepare(
        'SELECT id_produto FROM produtos WHERE nome = :nome ORDER BY id_produto LIMIT 1'
    );
    $stmt->execute([':nome' => $nome]);

    $id = $stmt->fetchColumn();

    return $id === false
        ? null
        : (int)$id;
}

function erroApi(Throwable $erro): never
{
    error_log(
        '[Velas S. Tome] '
        . $erro::class
        . ': '
        . $erro->getMessage()
    );

    $mensagem = 'Erro interno ao acessar o banco de dados.';

    if (
        $erro instanceof PDOException
        && str_contains($erro->getMessage(), 'Unknown database')
    ) {
        $mensagem =
            'O banco velas_s_tome não foi encontrado. Importe database/CriarBanco.sql no phpMyAdmin.';
    }

    responder(
        ['sucesso' => false, 'mensagem' => $mensagem],
        500
    );
}

protegerOrigem();
