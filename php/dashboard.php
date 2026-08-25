<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'DELETE');

try {
    $pdo = conectarBanco();
    if ($method === 'DELETE') {
        $pdo->exec('DELETE FROM atividades');
        jsonResponse(['sucesso'=>true]);
    }

    $summary = $pdo->query('SELECT * FROM vw_dashboard_resumo')->fetch() ?: [];
    $stmt = $pdo->query('SELECT descricao,categoria,criado_em FROM atividades ORDER BY criado_em DESC,id_atividade DESC LIMIT 20');
    $activities = array_map(static fn(array $row) => [
        'description'=>$row['descricao'],
        'category'=>$row['categoria'],
        'timestamp'=>timestampMs($row['criado_em'])
    ], $stmt->fetchAll());

    jsonResponse(['sucesso'=>true,'dashboard'=>[
        'clients'=>(int)($summary['clientes_cadastrados'] ?? 0),
        'products'=>(int)($summary['produtos_cadastrados'] ?? 0),
        'sales'=>(int)($summary['vendas_realizadas'] ?? 0),
        'revenue'=>(float)($summary['faturamento_vendas'] ?? 0),
        'orders'=>(int)($summary['pedidos_registrados'] ?? 0),
        'activities'=>$activities,
    ]]);
} catch (Throwable $e) { handleApiException($e); }
