<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'POST', 'PUT', 'DELETE');

function mapProduct(array $row): array {
    return [
        'id' => (string) $row['id_produto'],
        'name' => $row['nome'],
        'type' => $row['tipo'] ?? '',
        'color' => $row['cor'] ?? '',
        'unitValue' => (float) $row['valor_unitario'],
        'unitWeight' => (float) $row['peso_unitario'],
        'characteristic' => $row['caracteristica'] ?? '',
        'createdAt' => timestampMs($row['criado_em']),
    ];
}

try {
    $pdo = conectarBanco();

    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM produtos ORDER BY criado_em DESC, id_produto DESC')->fetchAll();
        jsonResponse(['sucesso' => true, 'produtos' => array_map('mapProduct', $rows)]);
    }

    $data = jsonInput();
    if ($method === 'POST' || $method === 'PUT') {
        $nome = cleanString($data['name'] ?? '', 120);
        $valor = decimalValue($data['unitValue'] ?? 0);
        $peso = decimalValue($data['unitWeight'] ?? 0);
        if ($nome === '') jsonResponse(['sucesso' => false, 'mensagem' => 'Digite o nome do produto.'], 422);
        if ($valor < 0) jsonResponse(['sucesso' => false, 'mensagem' => 'Informe um valor unitário válido.'], 422);
        if ($peso <= 0) jsonResponse(['sucesso' => false, 'mensagem' => 'Informe um peso unitário válido.'], 422);
    }

    if ($method === 'POST') {
        $stmt = $pdo->prepare('INSERT INTO produtos (nome,tipo,cor,valor_unitario,peso_unitario,caracteristica) VALUES (?,?,?,?,?,?)');
        $stmt->execute([
            $nome,
            nullableString($data['type'] ?? '', 80),
            nullableString($data['color'] ?? '', 60),
            $valor,
            $peso,
            nullableString($data['characteristic'] ?? '', 150)
        ]);
        $id = (int) $pdo->lastInsertId();
        addActivity($pdo, $user['id'], "Produto {$nome} cadastrado", 'Produtos');
        $stmt = $pdo->prepare('SELECT * FROM produtos WHERE id_produto=?');
        $stmt->execute([$id]);
        jsonResponse(['sucesso' => true, 'produto' => mapProduct($stmt->fetch())], 201);
    }

    if ($method === 'PUT') {
        $id = (int) ($data['id'] ?? 0);
        if ($id <= 0) jsonResponse(['sucesso' => false, 'mensagem' => 'Produto inválido.'], 422);
        $stmt = $pdo->prepare('UPDATE produtos SET nome=?,tipo=?,cor=?,valor_unitario=?,peso_unitario=?,caracteristica=? WHERE id_produto=?');
        $stmt->execute([
            $nome,
            nullableString($data['type'] ?? '', 80),
            nullableString($data['color'] ?? '', 60),
            $valor,
            $peso,
            nullableString($data['characteristic'] ?? '', 150),
            $id
        ]);
        $check = $pdo->prepare('SELECT * FROM produtos WHERE id_produto=?');
        $check->execute([$id]);
        $row = $check->fetch();
        if (!$row) jsonResponse(['sucesso' => false, 'mensagem' => 'Produto não encontrado.'], 404);
        addActivity($pdo, $user['id'], "Produto {$nome} atualizado", 'Produtos');
        jsonResponse(['sucesso' => true, 'produto' => mapProduct($row)]);
    }

    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) jsonResponse(['sucesso' => false, 'mensagem' => 'Produto inválido.'], 422);
    $stmt = $pdo->prepare('SELECT nome FROM produtos WHERE id_produto=?');
    $stmt->execute([$id]);
    $nome = $stmt->fetchColumn();
    if ($nome === false) jsonResponse(['sucesso' => false, 'mensagem' => 'Produto não encontrado.'], 404);
    $pdo->prepare('DELETE FROM produtos WHERE id_produto=?')->execute([$id]);
    addActivity($pdo, $user['id'], "Produto {$nome} removido", 'Produtos');
    jsonResponse(['sucesso' => true]);

} catch (Throwable $e) { handleApiException($e); }
