<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'POST');

function mapMovement(array $row): array {
    $source = match ($row['origem']) {
        'venda' => 'sale',
        'pedido' => 'order',
        default => 'manual',
    };
    $sourceId = $row['id_venda'] ?? $row['id_pedido'] ?? null;
    return [
        'id' => (string) $row['id_movimentacao'],
        'type' => $row['tipo_valor'],
        'description' => $row['descricao'],
        'value' => (float) $row['valor'],
        'weight' => (float) $row['peso'],
        'weightType' => $row['tipo_peso'],
        'createdAt' => timestampMs($row['criado_em']),
        'source' => $source,
        'sourceId' => $sourceId === null ? null : (string) $sourceId,
    ];
}

try {
    $pdo = conectarBanco();
    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM controle_geral ORDER BY criado_em DESC, id_movimentacao DESC')->fetchAll();
        $summary = $pdo->query('SELECT * FROM vw_controle_geral_resumo')->fetch() ?: [];
        jsonResponse([
            'sucesso'=>true,
            'movimentacoes'=>array_map('mapMovement', $rows),
            'resumo'=>[
                'totalIncome'=>(float)($summary['total_entradas'] ?? 0),
                'totalExpenses'=>(float)($summary['total_saidas'] ?? 0),
                'currentBalance'=>(float)($summary['saldo_financeiro'] ?? 0),
                'totalWeightIncome'=>(float)($summary['total_peso_entrada'] ?? 0),
                'totalWeightExpenses'=>(float)($summary['total_peso_saida'] ?? 0),
                'currentWeightBalance'=>(float)($summary['saldo_peso'] ?? 0),
            ]
        ]);
    }

    $data = jsonInput();
    $type = ($data['type'] ?? '') === 'saida' ? 'saida' : 'entrada';
    $weightType = ($data['weightType'] ?? '') === 'saida' ? 'saida' : 'entrada';
    $description = cleanString($data['description'] ?? '', 180);
    $value = decimalValue($data['value'] ?? 0);
    $weight = decimalValue($data['weight'] ?? 0);

    if ($description === '') jsonResponse(['sucesso'=>false,'mensagem'=>'Informe a descrição da movimentação.'], 422);
    if ($value < 0 || $weight < 0 || ($value <= 0 && $weight <= 0)) {
        jsonResponse(['sucesso'=>false,'mensagem'=>'Informe um valor, um peso ou ambos.'], 422);
    }

    $stmt = $pdo->prepare('INSERT INTO controle_geral (descricao,tipo_valor,valor,tipo_peso,peso,origem) VALUES (?,?,?,?,?,\'manual\')');
    $stmt->execute([$description, $type, $value, $weightType, $weight]);
    $id = (int) $pdo->lastInsertId();
    $label = $type === 'entrada' ? 'Entrada' : 'Saída';
    addActivity($pdo, $user['id'], "{$label} geral: {$description}", 'Controle Geral');
    $stmt = $pdo->prepare('SELECT * FROM controle_geral WHERE id_movimentacao=?');
    $stmt->execute([$id]);
    jsonResponse(['sucesso'=>true,'movimentacao'=>mapMovement($stmt->fetch())], 201);
} catch (Throwable $e) { handleApiException($e); }
