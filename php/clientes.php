<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'POST', 'PUT', 'DELETE');

function mapClient(array $row): array {
    return [
        'id' => (string) $row['id_cliente'],
        'name' => $row['nome'],
        'email' => $row['email'] ?? '',
        'phone' => $row['telefone'] ?? '',
        'address' => $row['endereco'] ?? '',
        'city' => $row['cidade'] ?? '',
        'status' => $row['status'],
        'createdAt' => timestampMs($row['criado_em']),
    ];
}

try {
    $pdo = conectarBanco();

    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM clientes ORDER BY criado_em DESC, id_cliente DESC')->fetchAll();
        jsonResponse(['sucesso' => true, 'clientes' => array_map('mapClient', $rows)]);
    }

    if ($method === 'POST') {
        $data = jsonInput();
        $nome = cleanString($data['name'] ?? '', 100);
        if ($nome === '') jsonResponse(['sucesso' => false, 'mensagem' => 'Digite o nome do cliente.'], 422);
        $status = ($data['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

        $stmt = $pdo->prepare('INSERT INTO clientes (nome,email,telefone,endereco,cidade,status) VALUES (?,?,?,?,?,?)');
        $stmt->execute([
            $nome,
            nullableString($data['email'] ?? '', 120),
            nullableString($data['phone'] ?? '', 20),
            nullableString($data['address'] ?? '', 180),
            nullableString($data['city'] ?? '', 80),
            $status
        ]);
        $id = (int) $pdo->lastInsertId();
        addActivity($pdo, $user['id'], "Cliente {$nome} cadastrado", 'Clientes');
        $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id_cliente = ?');
        $stmt->execute([$id]);
        jsonResponse(['sucesso' => true, 'cliente' => mapClient($stmt->fetch())], 201);
    }

    if ($method === 'PUT') {
        $data = jsonInput();
        $id = (int) ($data['id'] ?? 0);
        $nome = cleanString($data['name'] ?? '', 100);
        if ($id <= 0 || $nome === '') jsonResponse(['sucesso' => false, 'mensagem' => 'Dados do cliente inválidos.'], 422);
        $status = ($data['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

        $stmt = $pdo->prepare('UPDATE clientes SET nome=?,email=?,telefone=?,endereco=?,cidade=?,status=? WHERE id_cliente=?');
        $stmt->execute([
            $nome,
            nullableString($data['email'] ?? '', 120),
            nullableString($data['phone'] ?? '', 20),
            nullableString($data['address'] ?? '', 180),
            nullableString($data['city'] ?? '', 80),
            $status,
            $id
        ]);
        if ($stmt->rowCount() === 0) {
            $check = $pdo->prepare('SELECT 1 FROM clientes WHERE id_cliente=?');
            $check->execute([$id]);
            if (!$check->fetchColumn()) jsonResponse(['sucesso' => false, 'mensagem' => 'Cliente não encontrado.'], 404);
        }
        addActivity($pdo, $user['id'], "Cliente {$nome} atualizado", 'Clientes');
        $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id_cliente = ?');
        $stmt->execute([$id]);
        jsonResponse(['sucesso' => true, 'cliente' => mapClient($stmt->fetch())]);
    }

    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) jsonResponse(['sucesso' => false, 'mensagem' => 'Cliente inválido.'], 422);
    $stmt = $pdo->prepare('SELECT nome FROM clientes WHERE id_cliente=?');
    $stmt->execute([$id]);
    $nome = $stmt->fetchColumn();
    if ($nome === false) jsonResponse(['sucesso' => false, 'mensagem' => 'Cliente não encontrado.'], 404);
    $stmt = $pdo->prepare('DELETE FROM clientes WHERE id_cliente=?');
    $stmt->execute([$id]);
    addActivity($pdo, $user['id'], "Cliente {$nome} removido", 'Clientes');
    jsonResponse(['sucesso' => true]);

} catch (Throwable $e) { handleApiException($e); }
