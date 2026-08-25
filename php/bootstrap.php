<?php
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

require_once __DIR__ . '/config/database.php';

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function jsonInput(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonResponse(['sucesso' => false, 'mensagem' => 'JSON inválido.'], 400);
    }
    return $data;
}

function requireMethod(string ...$allowed): string
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $allowed = array_map('strtoupper', $allowed);
    if (!in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        jsonResponse(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
    }
    return $method;
}

function currentUser(): ?array
{
    if (empty($_SESSION['usuario_id']) || empty($_SESSION['usuario_nome'])) {
        return null;
    }
    return [
        'id' => (int) $_SESSION['usuario_id'],
        'nome' => (string) $_SESSION['usuario_nome'],
    ];
}

function requireAuth(): array
{
    $user = currentUser();
    if (!$user) {
        jsonResponse([
            'sucesso' => false,
            'autenticado' => false,
            'mensagem' => 'Sua sessão expirou. Faça login novamente.'
        ], 401);
    }
    return $user;
}

function cleanString(mixed $value, int $max = 255): string
{
    $value = trim((string) ($value ?? ''));
    return mb_substr($value, 0, $max);
}

function nullableString(mixed $value, int $max = 255): ?string
{
    $value = cleanString($value, $max);
    return $value === '' ? null : $value;
}

function decimalValue(mixed $value): float
{
    if (is_string($value)) {
        $value = trim($value);
        if (str_contains($value, ',')) {
            $value = str_replace('.', '', $value);
            $value = str_replace(',', '.', $value);
        }
    }
    return is_numeric($value) ? (float) $value : 0.0;
}

function timestampMs(?string $value): int
{
    if (!$value) return 0;
    $time = strtotime($value);
    return $time === false ? 0 : $time * 1000;
}

function brDateToSql(string $date): ?string
{
    $date = trim($date);
    $dt = DateTime::createFromFormat('d/m/Y', $date);
    if (!$dt || $dt->format('d/m/Y') !== $date) return null;
    return $dt->format('Y-m-d');
}

function sqlDateToBr(string $date): string
{
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    return $dt ? $dt->format('d/m/Y') : $date;
}

function addActivity(PDO $pdo, int $userId, string $description, string $category): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO atividades (id_usuario, descricao, categoria) VALUES (?, ?, ?)'
    );
    $stmt->execute([
        $userId,
        cleanString($description, 255),
        cleanString($category, 60),
    ]);
}

function findClientIdByName(PDO $pdo, string $name): ?int
{
    $stmt = $pdo->prepare('SELECT id_cliente FROM clientes WHERE nome = ? LIMIT 1');
    $stmt->execute([$name]);
    $id = $stmt->fetchColumn();
    return $id === false ? null : (int) $id;
}

function findProductIdByName(PDO $pdo, string $name): ?int
{
    $stmt = $pdo->prepare('SELECT id_produto FROM produtos WHERE nome = ? LIMIT 1');
    $stmt->execute([$name]);
    $id = $stmt->fetchColumn();
    return $id === false ? null : (int) $id;
}

function handleApiException(Throwable $e): never
{
    error_log('[Velas S. Tome API] ' . $e->getMessage());
    jsonResponse([
        'sucesso' => false,
        'mensagem' => 'Não foi possível concluir a operação no banco de dados.'
    ], 500);
}
