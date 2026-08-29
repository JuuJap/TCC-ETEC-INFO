<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'POST', 'PUT', 'DELETE');

function vendaFront(array $r): array
{
    return [
        'id' => (string) $r['id_venda'],
        'description' => (string) $r['descricao'],
        'value' => (float) $r['valor'],
        'createdAt' => milissegundos($r['criado_em'] ?? null),
    ];
}

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT * FROM vendas WHERE id_venda=:id');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) responder(['sucesso' => false, 'mensagem' => 'Venda não encontrada.'], 404);
            responder(['sucesso' => true, 'venda' => vendaFront($row)]);
        }

        $rows = $pdo->query('SELECT * FROM vendas ORDER BY criado_em DESC, id_venda DESC')->fetchAll();
        responder(['sucesso' => true, 'vendas' => array_map('vendaFront', $rows)]);
    }

    $dados = entrada();

    if ($metodo === 'DELETE') {
        $id = (int) ($_GET['id'] ?? $dados['id'] ?? 0);
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Venda inválida.'], 422);
        $stmt = $pdo->prepare('SELECT descricao FROM vendas WHERE id_venda=:id');
        $stmt->execute([':id' => $id]);
        $descricao = $stmt->fetchColumn();
        if ($descricao === false) responder(['sucesso' => false, 'mensagem' => 'Venda não encontrada.'], 404);

        // A FK ON DELETE CASCADE remove o movimento automático de controle_geral.
        $pdo->prepare('DELETE FROM vendas WHERE id_venda=:id')->execute([':id' => $id]);
        registrarAtividade($pdo, $usuario['id'], "Venda removida: {$descricao}", 'Vendas');
        responder(['sucesso' => true, 'mensagem' => 'Venda removida.']);
    }

    $id = (int) ($dados['id'] ?? $dados['id_venda'] ?? 0);
    $descricao = texto($dados['description'] ?? $dados['descricao'] ?? '', 120);
    $valor = decimal($dados['value'] ?? $dados['valor'] ?? 0);

    if ($descricao === '') responder(['sucesso' => false, 'mensagem' => 'Informe o cliente ou a descrição da venda.'], 422);
    if ($valor <= 0) responder(['sucesso' => false, 'mensagem' => 'Informe um valor maior que zero.'], 422);

    if ($metodo === 'POST') {
        $stmt = $pdo->prepare('INSERT INTO vendas (descricao, valor) VALUES (:descricao,:valor)');
        $stmt->execute(compact('descricao', 'valor'));
        $id = (int) $pdo->lastInsertId();
        // trg_vendas_ai cria controle_geral automaticamente.
        registrarAtividade($pdo, $usuario['id'], "Venda registrada: {$descricao}", 'Vendas');
        $statusHttp = 201;
    } else {
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Venda inválida.'], 422);
        $stmt = $pdo->prepare('UPDATE vendas SET descricao=:descricao, valor=:valor WHERE id_venda=:id');
        $stmt->execute(compact('descricao', 'valor', 'id'));
        // trg_vendas_au atualiza controle_geral automaticamente.
        registrarAtividade($pdo, $usuario['id'], "Venda atualizada: {$descricao}", 'Vendas');
        $statusHttp = 200;
    }

    $stmt = $pdo->prepare('SELECT * FROM vendas WHERE id_venda=:id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) responder(['sucesso' => false, 'mensagem' => 'Venda não encontrada.'], 404);

    responder(['sucesso' => true, 'venda' => vendaFront($row)], $statusHttp);
} catch (Throwable $erro) {
    erroApi($erro);
}
