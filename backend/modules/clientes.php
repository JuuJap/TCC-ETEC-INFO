<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'POST', 'PUT', 'DELETE');

function clienteFront(array $r): array
{
    return [
        'id' => (string) $r['id_cliente'],
        'name' => (string) $r['nome'],
        'email' => $r['email'] ?? '',
        'phone' => $r['telefone'] ?? '',
        'address' => $r['endereco'] ?? '',
        'city' => $r['cidade'] ?? '',
        'status' => (string) $r['status'],
        'createdAt' => milissegundos($r['criado_em'] ?? null),
        'updatedAt' => milissegundos($r['atualizado_em'] ?? null),
    ];
}

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id_cliente = :id');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) responder(['sucesso' => false, 'mensagem' => 'Cliente não encontrado.'], 404);
            responder(['sucesso' => true, 'cliente' => clienteFront($row)]);
        }

        $rows = $pdo->query('SELECT * FROM clientes ORDER BY criado_em DESC, id_cliente DESC')->fetchAll();
        responder(['sucesso' => true, 'clientes' => array_map('clienteFront', $rows)]);
    }

    $dados = entrada();

    if ($metodo === 'DELETE') {
        $id = (int) ($_GET['id'] ?? $dados['id'] ?? 0);
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Cliente inválido.'], 422);

        $stmt = $pdo->prepare('SELECT nome FROM clientes WHERE id_cliente = :id');
        $stmt->execute([':id' => $id]);
        $nome = $stmt->fetchColumn();
        if ($nome === false) responder(['sucesso' => false, 'mensagem' => 'Cliente não encontrado.'], 404);

        $pdo->prepare('DELETE FROM clientes WHERE id_cliente = :id')->execute([':id' => $id]);
        registrarAtividade($pdo, $usuario['id'], "Cliente {$nome} removido", 'Clientes');
        responder(['sucesso' => true, 'mensagem' => 'Cliente removido.']);
    }

    $id = (int) ($dados['id'] ?? $dados['id_cliente'] ?? 0);
    $nome = texto($dados['name'] ?? $dados['nome'] ?? '', 100);
    $email = textoOuNull($dados['email'] ?? '', 120);
    $telefone = textoOuNull($dados['phone'] ?? $dados['telefone'] ?? '', 20);
    $endereco = textoOuNull($dados['address'] ?? $dados['endereco'] ?? '', 180);
    $cidade = textoOuNull($dados['city'] ?? $dados['cidade'] ?? '', 80);
    $status = ($dados['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

    if ($nome === '') responder(['sucesso' => false, 'mensagem' => 'Digite o nome do cliente.'], 422);
    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responder(['sucesso' => false, 'mensagem' => 'Informe um e-mail válido ou deixe o campo vazio.'], 422);
    }

    if ($metodo === 'POST') {
        $stmt = $pdo->prepare(
            'INSERT INTO clientes (nome, email, telefone, endereco, cidade, status)
             VALUES (:nome, :email, :telefone, :endereco, :cidade, :status)'
        );
        $stmt->execute(compact('nome', 'email', 'telefone', 'endereco', 'cidade', 'status'));
        $id = (int) $pdo->lastInsertId();
        registrarAtividade($pdo, $usuario['id'], "Cliente {$nome} cadastrado", 'Clientes');
        $statusHttp = 201;
    } else {
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Cliente inválido.'], 422);
        $stmt = $pdo->prepare(
            'UPDATE clientes SET nome=:nome, email=:email, telefone=:telefone, endereco=:endereco, cidade=:cidade, status=:status
             WHERE id_cliente=:id'
        );
        $stmt->execute(compact('nome', 'email', 'telefone', 'endereco', 'cidade', 'status', 'id'));
        registrarAtividade($pdo, $usuario['id'], "Cliente {$nome} atualizado", 'Clientes');
        $statusHttp = 200;
    }

    $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id_cliente = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) responder(['sucesso' => false, 'mensagem' => 'Cliente não encontrado.'], 404);

    responder(['sucesso' => true, 'cliente' => clienteFront($row)], $statusHttp);
} catch (Throwable $erro) {
    erroApi($erro);
}
