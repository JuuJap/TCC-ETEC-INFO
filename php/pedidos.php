<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'POST', 'PUT', 'DELETE');

function fetchOrder(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id_pedido=?');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) return null;

    $itemsStmt = $pdo->prepare('SELECT * FROM itens_pedido WHERE id_pedido=? ORDER BY id_item_pedido');
    $itemsStmt->execute([$id]);
    $items = [];
    foreach ($itemsStmt->fetchAll() as $item) {
        $qty = (int) $item['quantidade'];
        $unitValue = (float) $item['valor_unitario'];
        $unitWeight = (float) $item['peso_unitario'];
        $items[] = [
            'id' => (string) $item['id_item_pedido'],
            'description' => $item['descricao'],
            'quantity' => $qty,
            'unitValue' => $unitValue,
            'unitWeight' => $unitWeight,
            'totalValue' => $qty * $unitValue,
            'totalWeight' => $qty * $unitWeight,
        ];
    }

    return [
        'id' => (string) $order['id_pedido'],
        'number' => (int) $order['numero_pedido'],
        'client' => $order['cliente_nome'],
        'address' => $order['endereco_entrega'],
        'date' => sqlDateToBr($order['data_pedido']),
        'items' => $items,
        'totalValue' => (float) $order['valor_total'],
        'totalWeight' => (float) $order['peso_total'],
        'createdAt' => timestampMs($order['criado_em']),
        'updatedAt' => timestampMs($order['atualizado_em']),
    ];
}

function validateOrderPayload(array $data): array
{
    $client = cleanString($data['client'] ?? '', 120);
    $address = cleanString($data['address'] ?? '', 180);
    $date = brDateToSql(cleanString($data['date'] ?? '', 10));
    $items = $data['items'] ?? [];

    if ($client === '') jsonResponse(['sucesso'=>false,'mensagem'=>'Informe o cliente.'], 422);
    if ($address === '') jsonResponse(['sucesso'=>false,'mensagem'=>'Informe o endereço ou local de entrega.'], 422);
    if (!$date) jsonResponse(['sucesso'=>false,'mensagem'=>'Data do pedido inválida.'], 422);
    if (!is_array($items) || count($items) === 0) jsonResponse(['sucesso'=>false,'mensagem'=>'Adicione pelo menos um item ao pedido.'], 422);

    $cleanItems = [];
    foreach ($items as $item) {
        $description = cleanString($item['description'] ?? '', 140);
        $quantity = max(1, (int) ($item['quantity'] ?? 1));
        $unitValue = decimalValue($item['unitValue'] ?? 0);
        $unitWeight = decimalValue($item['unitWeight'] ?? 0);
        if ($description === '' || $unitValue <= 0 || $unitWeight <= 0) {
            jsonResponse(['sucesso'=>false,'mensagem'=>'Há um item do pedido com dados inválidos.'], 422);
        }
        $cleanItems[] = compact('description','quantity','unitValue','unitWeight');
    }

    return compact('client','address','date','cleanItems');
}

try {
    $pdo = conectarBanco();

    if ($method === 'GET') {
        $ids = $pdo->query('SELECT id_pedido FROM pedidos ORDER BY criado_em DESC, id_pedido DESC')->fetchAll(PDO::FETCH_COLUMN);
        $orders = [];
        foreach ($ids as $id) {
            $order = fetchOrder($pdo, (int) $id);
            if ($order) $orders[] = $order;
        }
        $next = (int) $pdo->query('SELECT COALESCE(MAX(numero_pedido),0)+1 FROM pedidos')->fetchColumn();
        jsonResponse(['sucesso'=>true,'pedidos'=>$orders,'proximoNumero'=>$next]);
    }

    if ($method === 'POST' || $method === 'PUT') {
        $data = jsonInput();
        $payload = validateOrderPayload($data);
        $client = $payload['client'];
        $address = $payload['address'];
        $date = $payload['date'];
        $items = $payload['cleanItems'];
        $clientId = findClientIdByName($pdo, $client);

        $pdo->beginTransaction();
        try {
            if ($method === 'POST') {
                $number = (int) $pdo->query('SELECT COALESCE(MAX(numero_pedido),0)+1 FROM pedidos')->fetchColumn();
                $stmt = $pdo->prepare('INSERT INTO pedidos (numero_pedido,id_cliente,cliente_nome,endereco_entrega,data_pedido) VALUES (?,?,?,?,?)');
                $stmt->execute([$number, $clientId, $client, $address, $date]);
                $id = (int) $pdo->lastInsertId();
                $activityText = sprintf('Pedido #%04d registrado: %s', $number, $client);
            } else {
                $id = (int) ($data['id'] ?? 0);
                if ($id <= 0) jsonResponse(['sucesso'=>false,'mensagem'=>'Pedido inválido.'], 422);
                $check = $pdo->prepare('SELECT numero_pedido FROM pedidos WHERE id_pedido=?');
                $check->execute([$id]);
                $number = $check->fetchColumn();
                if ($number === false) jsonResponse(['sucesso'=>false,'mensagem'=>'Pedido não encontrado.'], 404);
                $stmt = $pdo->prepare('UPDATE pedidos SET id_cliente=?,cliente_nome=?,endereco_entrega=?,data_pedido=? WHERE id_pedido=?');
                $stmt->execute([$clientId, $client, $address, $date, $id]);
                $pdo->prepare('DELETE FROM itens_pedido WHERE id_pedido=?')->execute([$id]);
                $activityText = sprintf('Pedido #%04d atualizado: %s', (int)$number, $client);
            }

            $insert = $pdo->prepare('INSERT INTO itens_pedido (id_pedido,id_produto,descricao,quantidade,valor_unitario,peso_unitario) VALUES (?,?,?,?,?,?)');
            foreach ($items as $item) {
                $productId = findProductIdByName($pdo, $item['description']);
                $insert->execute([
                    $id,
                    $productId,
                    $item['description'],
                    $item['quantity'],
                    $item['unitValue'],
                    $item['unitWeight'],
                ]);
            }

            addActivity($pdo, $user['id'], $activityText, 'Pedidos');
            $pdo->commit();
        } catch (Throwable $inner) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $inner;
        }

        $order = fetchOrder($pdo, $id);
        jsonResponse(['sucesso'=>true,'pedido'=>$order], $method === 'POST' ? 201 : 200);
    }

    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) jsonResponse(['sucesso'=>false,'mensagem'=>'Pedido inválido.'], 422);
    $stmt = $pdo->prepare('SELECT numero_pedido,cliente_nome FROM pedidos WHERE id_pedido=?');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) jsonResponse(['sucesso'=>false,'mensagem'=>'Pedido não encontrado.'], 404);
    $pdo->prepare('DELETE FROM pedidos WHERE id_pedido=?')->execute([$id]);
    addActivity($pdo, $user['id'], sprintf('Pedido #%04d excluído: %s', (int)$order['numero_pedido'], $order['cliente_nome']), 'Pedidos');
    jsonResponse(['sucesso'=>true]);

} catch (Throwable $e) { handleApiException($e); }
