<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'POST');

function mapSale(array $row): array {
    return [
        'id' => (string) $row['id_venda'],
        'description' => $row['descricao'],
        'value' => (float) $row['valor'],
        'createdAt' => timestampMs($row['criado_em']),
    ];
}

try {
    $pdo = conectarBanco();
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM vendas ORDER BY criado_em DESC, id_venda DESC')->fetchAll();
        jsonResponse(['sucesso' => true, 'vendas' => array_map('mapSale', $rows)]);
    }

    $data = jsonInput();
    $descricao = cleanString($data['description'] ?? '', 120);
    $valor = decimalValue($data['value'] ?? 0);
    if ($descricao === '') jsonResponse(['sucesso' => false, 'mensagem' => 'Informe o cliente ou a descrição da venda.'], 422);
    if ($valor <= 0) jsonResponse(['sucesso' => false, 'mensagem' => 'Informe um valor válido para a venda.'], 422);

    $stmt = $pdo->prepare('INSERT INTO vendas (descricao, valor) VALUES (?, ?)');
    $stmt->execute([$descricao, $valor]);
    $id = (int) $pdo->lastInsertId();
    addActivity($pdo, $user['id'], "Venda registrada: {$descricao}", 'Vendas');
    $stmt = $pdo->prepare('SELECT * FROM vendas WHERE id_venda=?');
    $stmt->execute([$id]);
    jsonResponse(['sucesso' => true, 'venda' => mapSale($stmt->fetch())], 201);
} catch (Throwable $e) { handleApiException($e); }
