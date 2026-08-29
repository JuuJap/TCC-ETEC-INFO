<?php
declare(strict_types=1);

/**
 * Conexão PDO - Velas S. Tomé
 * XAMPP padrão: host 127.0.0.1, usuário root, senha vazia.
 * Em produção, prefira definir as variáveis de ambiente abaixo.
 */

$DB_HOST = getenv('VST_DB_HOST') ?: '127.0.0.1';
$DB_PORT = getenv('VST_DB_PORT') ?: '3306';
$DB_NAME = getenv('VST_DB_NAME') ?: 'velas_s_tome';
$DB_USER = getenv('VST_DB_USER') ?: 'root';
$DB_PASS = getenv('VST_DB_PASS') !== false ? getenv('VST_DB_PASS') : '';

$dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'message' => 'Não foi possível conectar ao banco de dados.',
        'error' => getenv('VST_DEBUG') === '1' ? $e->getMessage() : null,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
