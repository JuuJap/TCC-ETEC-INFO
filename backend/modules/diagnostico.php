<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/../config/database.php';

$esperadas = [
    'usuarios', 'clientes', 'produtos', 'vendas', 'pedidos', 'itens_pedido',
    'controle_geral', 'atividades', 'configuracoes_empresa',
    'vw_dashboard_resumo', 'vw_controle_geral_resumo'
];

function linha(string $nome, bool $ok, string $detalhe = ''): void {
    $status = $ok ? 'OK' : 'ERRO';
    $cor = $ok ? '#137333' : '#b3261e';
    echo '<tr><td>' . htmlspecialchars($nome) . '</td><td style="font-weight:700;color:' . $cor . '">' . $status . '</td><td>' . htmlspecialchars($detalhe) . '</td></tr>';
}

echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Diagnóstico - Velas S. Tomé</title>';
echo '<style>body{font-family:Arial,sans-serif;max-width:1000px;margin:40px auto;padding:0 20px;background:#f5f5f5;color:#222}table{width:100%;border-collapse:collapse;background:white}th,td{padding:12px;border:1px solid #ddd;text-align:left}h1{margin-bottom:8px}</style>';
echo '<h1>Diagnóstico do backend</h1><p>Banco esperado: <strong>velas_s_tome</strong></p><table><tr><th>Teste</th><th>Status</th><th>Detalhes</th></tr>';

linha('PHP', version_compare(PHP_VERSION, '8.0.0', '>='), PHP_VERSION);
linha('PDO MySQL', extension_loaded('pdo_mysql'), extension_loaded('pdo_mysql') ? 'Extensão carregada' : 'Ative pdo_mysql no PHP');

try {
    $pdo = conectarBanco();
    linha('Conexão MySQL', true, 'Conectado ao banco velas_s_tome');

    foreach ($esperadas as $estrutura) {
        if (str_starts_with($estrutura, 'vw_')) {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.VIEWS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?");
        } else {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND TABLE_TYPE='BASE TABLE'");
        }
        $stmt->execute([$estrutura]);
        linha($estrutura, (int) $stmt->fetchColumn() === 1);
    }

    $triggers = ['trg_itens_pedido_ai','trg_itens_pedido_au','trg_itens_pedido_ad','trg_vendas_ai','trg_vendas_au','trg_pedidos_au'];
    foreach ($triggers as $trigger) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME=?');
        $stmt->execute([$trigger]);
        linha($trigger, (int) $stmt->fetchColumn() === 1, 'Trigger');
    }

    $frontIdChecks = [
        'clientes' => 'front_id',
        'produtos' => 'front_id',
        'vendas' => 'front_id',
        'pedidos' => 'front_id',
        'itens_pedido' => 'front_id',
        'controle_geral' => 'front_id',
    ];

    foreach ($frontIdChecks as $tabela => $coluna) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*)
               FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND COLUMN_NAME = ?'
        );
        $stmt->execute([$tabela, $coluna]);

        linha(
            "Sincronização: {$tabela}.{$coluna}",
            (int)$stmt->fetchColumn() === 1,
            'Coluna necessária para integração front-end/MySQL'
        );
    }
} catch (Throwable $e) {
    linha('Conexão MySQL', false, $e->getMessage());
}

echo '</table></html>';
