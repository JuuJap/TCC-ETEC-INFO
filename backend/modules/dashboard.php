<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'DELETE');

try {
    $pdo = conectarBanco();

    if ($metodo === 'DELETE') {
        // Limpa apenas a lista de atividades; não apaga clientes, vendas etc.
        $stmt = $pdo->prepare('DELETE FROM atividades WHERE id_usuario = :usuario');
        $stmt->execute([':usuario' => $usuario['id']]);
        responder(['sucesso' => true, 'mensagem' => 'Atividades recentes removidas.']);
    }

    $resumo = $pdo->query('SELECT * FROM vw_dashboard_resumo')->fetch() ?: [];
    $stmt = $pdo->prepare('SELECT id_atividade, descricao, categoria, criado_em FROM atividades WHERE id_usuario = :usuario OR id_usuario IS NULL ORDER BY criado_em DESC, id_atividade DESC LIMIT 20');
    $stmt->execute([':usuario' => $usuario['id']]);
    $atividades = array_map(static function (array $r): array {
        return [
            'id' => (string) $r['id_atividade'],
            'description' => (string) $r['descricao'],
            'category' => (string) $r['categoria'],
            'timestamp' => milissegundos($r['criado_em'] ?? null),
        ];
    }, $stmt->fetchAll());

    responder([
        'sucesso' => true,
        'dashboard' => [
            'clients' => (int) ($resumo['clientes_cadastrados'] ?? 0),
            'activeClients' => (int) ($resumo['clientes_ativos'] ?? 0),
            'products' => (int) ($resumo['produtos_cadastrados'] ?? 0),
            'sales' => (int) ($resumo['vendas_realizadas'] ?? 0),
            'revenue' => (float) ($resumo['faturamento_vendas'] ?? 0),
            'orders' => (int) ($resumo['pedidos_registrados'] ?? 0),
            'activities' => $atividades,
        ],
    ]);
} catch (Throwable $erro) {
    erroApi($erro);
}
