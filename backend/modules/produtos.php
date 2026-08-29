<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'POST', 'PUT', 'DELETE');

function produtoFront(array $r): array
{
    return [
        'id' => (string) $r['id_produto'],
        'name' => (string) $r['nome'],
        'type' => $r['tipo'] ?? '',
        'color' => $r['cor'] ?? '',
        'unitValue' => (float) $r['valor_unitario'],
        'unitWeight' => (float) $r['peso_unitario'],
        'characteristic' => $r['caracteristica'] ?? '',
        'createdAt' => milissegundos($r['criado_em'] ?? null),
        'updatedAt' => milissegundos($r['atualizado_em'] ?? null),
    ];
}

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT * FROM produtos WHERE id_produto=:id');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) responder(['sucesso' => false, 'mensagem' => 'Produto não encontrado.'], 404);
            responder(['sucesso' => true, 'produto' => produtoFront($row)]);
        }

        $rows = $pdo->query('SELECT * FROM produtos ORDER BY criado_em DESC, id_produto DESC')->fetchAll();
        responder(['sucesso' => true, 'produtos' => array_map('produtoFront', $rows)]);
    }

    $dados = entrada();

    if ($metodo === 'DELETE') {
        $id = (int) ($_GET['id'] ?? $dados['id'] ?? 0);
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Produto inválido.'], 422);

        $stmt = $pdo->prepare('SELECT nome FROM produtos WHERE id_produto=:id');
        $stmt->execute([':id' => $id]);
        $nome = $stmt->fetchColumn();
        if ($nome === false) responder(['sucesso' => false, 'mensagem' => 'Produto não encontrado.'], 404);

        $pdo->prepare('DELETE FROM produtos WHERE id_produto=:id')->execute([':id' => $id]);
        registrarAtividade($pdo, $usuario['id'], "Produto {$nome} removido", 'Produtos');
        responder(['sucesso' => true, 'mensagem' => 'Produto removido.']);
    }

    $id = (int) ($dados['id'] ?? $dados['id_produto'] ?? 0);
    $nome = texto($dados['name'] ?? $dados['nome'] ?? '', 120);
    $tipo = textoOuNull($dados['type'] ?? $dados['tipo'] ?? '', 80);
    $cor = textoOuNull($dados['color'] ?? $dados['cor'] ?? '', 60);
    $valor = decimal($dados['unitValue'] ?? $dados['valor_unitario'] ?? 0);
    $peso = decimal($dados['unitWeight'] ?? $dados['peso_unitario'] ?? 0);
    $caracteristica = textoOuNull($dados['characteristic'] ?? $dados['caracteristica'] ?? '', 150);

    if ($nome === '') responder(['sucesso' => false, 'mensagem' => 'Digite o nome do produto.'], 422);
    if ($valor < 0) responder(['sucesso' => false, 'mensagem' => 'O valor unitário não pode ser negativo.'], 422);
    if ($peso <= 0) responder(['sucesso' => false, 'mensagem' => 'Informe um peso unitário maior que zero.'], 422);

    if ($metodo === 'POST') {
        $stmt = $pdo->prepare(
            'INSERT INTO produtos (nome,tipo,cor,valor_unitario,peso_unitario,caracteristica)
             VALUES (:nome,:tipo,:cor,:valor,:peso,:caracteristica)'
        );
        $stmt->execute(compact('nome', 'tipo', 'cor', 'valor', 'peso', 'caracteristica'));
        $id = (int) $pdo->lastInsertId();
        registrarAtividade($pdo, $usuario['id'], "Produto {$nome} cadastrado", 'Produtos');
        $statusHttp = 201;
    } else {
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Produto inválido.'], 422);
        $stmt = $pdo->prepare(
            'UPDATE produtos SET nome=:nome,tipo=:tipo,cor=:cor,valor_unitario=:valor,peso_unitario=:peso,caracteristica=:caracteristica
             WHERE id_produto=:id'
        );
        $stmt->execute(compact('nome', 'tipo', 'cor', 'valor', 'peso', 'caracteristica', 'id'));
        registrarAtividade($pdo, $usuario['id'], "Produto {$nome} atualizado", 'Produtos');
        $statusHttp = 200;
    }

    $stmt = $pdo->prepare('SELECT * FROM produtos WHERE id_produto=:id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) responder(['sucesso' => false, 'mensagem' => 'Produto não encontrado.'], 404);

    responder(['sucesso' => true, 'produto' => produtoFront($row)], $statusHttp);
} catch (Throwable $erro) {
    erroApi($erro);
}
