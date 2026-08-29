<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'POST', 'PUT', 'DELETE');

function movimentoFront(array $r): array
{
    $origem = (string) $r['origem'];
    return [
        'id' => (string) $r['id_movimentacao'],
        'type' => (string) $r['tipo_valor'],
        'description' => (string) $r['descricao'],
        'value' => (float) $r['valor'],
        'weightType' => (string) $r['tipo_peso'],
        'weight' => (float) $r['peso'],
        'source' => match ($origem) {
            'venda' => 'sale',
            'pedido' => 'order',
            default => 'manual',
        },
        'sourceId' => $r['id_venda'] !== null
            ? (string) $r['id_venda']
            : ($r['id_pedido'] !== null ? (string) $r['id_pedido'] : null),
        'createdAt' => milissegundos($r['criado_em'] ?? null),
        'updatedAt' => milissegundos($r['atualizado_em'] ?? null),
    ];
}

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET') {
        $rows = $pdo->query('SELECT * FROM controle_geral ORDER BY criado_em DESC, id_movimentacao DESC')->fetchAll();
        $resumo = $pdo->query('SELECT * FROM vw_controle_geral_resumo')->fetch() ?: [];
        responder([
            'sucesso' => true,
            'movimentacoes' => array_map('movimentoFront', $rows),
            'resumo' => [
                'totalEntradas' => (float) ($resumo['total_entradas'] ?? 0),
                'totalSaidas' => (float) ($resumo['total_saidas'] ?? 0),
                'saldoFinanceiro' => (float) ($resumo['saldo_financeiro'] ?? 0),
                'totalPesoEntrada' => (float) ($resumo['total_peso_entrada'] ?? 0),
                'totalPesoSaida' => (float) ($resumo['total_peso_saida'] ?? 0),
                'saldoPeso' => (float) ($resumo['saldo_peso'] ?? 0),
            ],
        ]);
    }

    $dados = entrada();
    $id = (int) ($_GET['id'] ?? $dados['id'] ?? 0);

    if ($metodo === 'DELETE') {
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Movimentação inválida.'], 422);
        $stmt = $pdo->prepare('SELECT descricao, origem FROM controle_geral WHERE id_movimentacao=:id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) responder(['sucesso' => false, 'mensagem' => 'Movimentação não encontrada.'], 404);
        if ($row['origem'] !== 'manual') {
            responder(['sucesso' => false, 'mensagem' => 'Movimentos de vendas e pedidos devem ser alterados na tela de origem.'], 409);
        }
        $pdo->prepare('DELETE FROM controle_geral WHERE id_movimentacao=:id')->execute([':id' => $id]);
        registrarAtividade($pdo, $usuario['id'], 'Movimentação removida: ' . $row['descricao'], 'Controle Geral');
        responder(['sucesso' => true, 'mensagem' => 'Movimentação removida.']);
    }

    $descricao = texto($dados['description'] ?? $dados['descricao'] ?? '', 180);
    $tipoValor = texto($dados['type'] ?? $dados['tipo_valor'] ?? 'entrada', 10);
    $valor = decimal($dados['value'] ?? $dados['valor'] ?? 0);
    $tipoPeso = texto($dados['weightType'] ?? $dados['tipo_peso'] ?? 'entrada', 10);
    $peso = decimal($dados['weight'] ?? $dados['peso'] ?? 0);

    if (!in_array($tipoValor, ['entrada', 'saida'], true)) responder(['sucesso' => false, 'mensagem' => 'Tipo financeiro inválido.'], 422);
    if (!in_array($tipoPeso, ['entrada', 'saida'], true)) responder(['sucesso' => false, 'mensagem' => 'Tipo de peso inválido.'], 422);
    if ($descricao === '') responder(['sucesso' => false, 'mensagem' => 'Informe a descrição da movimentação.'], 422);
    if ($valor < 0 || $peso < 0 || ($valor <= 0 && $peso <= 0)) {
        responder(['sucesso' => false, 'mensagem' => 'Informe um valor, um peso ou ambos.'], 422);
    }

    if ($metodo === 'POST') {
        $stmt = $pdo->prepare(
            "INSERT INTO controle_geral (descricao,tipo_valor,valor,tipo_peso,peso,origem)
             VALUES (:descricao,:tipoValor,:valor,:tipoPeso,:peso,'manual')"
        );
        $stmt->execute(compact('descricao', 'tipoValor', 'valor', 'tipoPeso', 'peso'));
        $id = (int) $pdo->lastInsertId();
        registrarAtividade($pdo, $usuario['id'], 'Movimentação registrada: ' . $descricao, 'Controle Geral');
        $statusHttp = 201;
    } else {
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Movimentação inválida.'], 422);
        $check = $pdo->prepare('SELECT origem FROM controle_geral WHERE id_movimentacao=:id');
        $check->execute([':id' => $id]);
        $origem = $check->fetchColumn();
        if ($origem === false) responder(['sucesso' => false, 'mensagem' => 'Movimentação não encontrada.'], 404);
        if ($origem !== 'manual') responder(['sucesso' => false, 'mensagem' => 'Movimentos automáticos não podem ser editados diretamente.'], 409);

        $stmt = $pdo->prepare(
            'UPDATE controle_geral SET descricao=:descricao,tipo_valor=:tipoValor,valor=:valor,tipo_peso=:tipoPeso,peso=:peso
             WHERE id_movimentacao=:id'
        );
        $stmt->execute(compact('descricao', 'tipoValor', 'valor', 'tipoPeso', 'peso', 'id'));
        registrarAtividade($pdo, $usuario['id'], 'Movimentação atualizada: ' . $descricao, 'Controle Geral');
        $statusHttp = 200;
    }

    $stmt = $pdo->prepare('SELECT * FROM controle_geral WHERE id_movimentacao=:id');
    $stmt->execute([':id' => $id]);
    responder(['sucesso' => true, 'movimentacao' => movimentoFront($stmt->fetch())], $statusHttp);
} catch (Throwable $erro) {
    erroApi($erro);
}
