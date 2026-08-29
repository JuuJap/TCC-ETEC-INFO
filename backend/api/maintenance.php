<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$userId = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Método não permitido.'], 405);
}

$body = requestBody();
$action = strtolower(normalizeString($body['action'] ?? '', 40));

function clearOperationalData(PDO $pdo): void
{
    // A ordem respeita as FKs. Pedidos/Vendas removem automaticamente
    // as movimentações vinculadas do Controle Geral por ON DELETE CASCADE.
    $pdo->exec('DELETE FROM pedidos');
    $pdo->exec('DELETE FROM vendas');
    $pdo->exec("DELETE FROM controle_geral WHERE origem = 'manual'");
    $pdo->exec('DELETE FROM atividades');
    $pdo->exec('DELETE FROM produtos');
    $pdo->exec('DELETE FROM clientes');
}

function demoDate(int $daysAgo): string
{
    $date = new DateTimeImmutable('now');
    return $date->modify("-{$daysAgo} days")->format('Y-m-d H:i:s');
}

function demoOrderDate(int $daysAgo): string
{
    $date = new DateTimeImmutable('today');
    return $date->modify("-{$daysAgo} days")->format('Y-m-d');
}

function insertDemoData(PDO $pdo, int $userId): void
{
    $clientInsert = $pdo->prepare(
        'INSERT INTO clientes (front_id, nome, email, telefone, endereco, cidade, status, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $clients = [
        ['demo-client-1', 'Ana Souza', 'ana.souza@exemplo.com', '(11) 99912-4580', 'Rua das Flores, 120', 'São Paulo', 'active', 2],
        ['demo-client-2', 'Carlos Mendes', 'carlos.mendes@exemplo.com', '(11) 98845-1022', 'Avenida Central, 845', 'Guarulhos', 'active', 6],
        ['demo-client-3', 'Fernanda Lima', 'fernanda.lima@exemplo.com', '(11) 97734-8621', 'Rua das Acácias, 310', 'São Bernardo do Campo', 'active', 12],
        ['demo-client-4', 'Marcos Oliveira', null, '(11) 96620-3175', 'Rua São João, 76', 'Santo André', 'inactive', 38],
    ];

    $clientIds = [];
    foreach ($clients as [$frontId, $name, $email, $phone, $address, $city, $status, $daysAgo]) {
        $clientInsert->execute([$frontId, $name, $email, $phone, $address, $city, $status, demoDate($daysAgo)]);
        $clientIds[$name] = (int)$pdo->lastInsertId();
    }

    $productInsert = $pdo->prepare(
        'INSERT INTO produtos (front_id, nome, tipo, cor, valor_unitario, peso_unitario, caracteristica, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $products = [
        ['demo-product-1', 'Vela Aromática de Lavanda', 'Aromática', 'Bege', 25.90, 250.500, 'Aroma de lavanda', 3],
        ['demo-product-2', 'Vela de Baunilha', 'Aromática', 'Branca', 29.50, 300.000, 'Aroma de baunilha', 7],
        ['demo-product-3', 'Vela Decorativa Floral', 'Decorativa', 'Rosa', 34.90, 180.750, 'Formato floral', 10],
        ['demo-product-4', 'Vela Clássica', 'Tradicional', 'Branca', 0.00, 220.500, 'Sem aroma', 42],
    ];

    $productIds = [];
    foreach ($products as [$frontId, $name, $type, $color, $value, $weight, $characteristic, $daysAgo]) {
        $productInsert->execute([$frontId, $name, $type, $color, $value, $weight, $characteristic, demoDate($daysAgo)]);
        $productIds[$name] = (int)$pdo->lastInsertId();
    }

    // Vendas criam automaticamente suas entradas no Controle Geral via trigger.
    $saleInsert = $pdo->prepare(
        'INSERT INTO vendas (front_id, descricao, valor, criado_em) VALUES (?, ?, ?, ?)'
    );
    $sales = [
        ['demo-sale-1', 'Venda para Ana Souza', 51.80, 1],
        ['demo-sale-2', 'Venda balcão', 64.40, 9],
        ['demo-sale-3', 'Venda mês anterior', 29.50, 36],
    ];
    foreach ($sales as [$frontId, $description, $value, $daysAgo]) {
        $saleInsert->execute([$frontId, $description, $value, demoDate($daysAgo)]);
    }

    $orderInsert = $pdo->prepare(
        'INSERT INTO pedidos (front_id, numero_pedido, id_cliente, cliente_nome, endereco_entrega, data_pedido, valor_total, peso_total, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)'
    );
    $itemInsert = $pdo->prepare(
        'INSERT INTO itens_pedido (front_id, id_pedido, id_produto, descricao, quantidade, valor_unitario, peso_unitario, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    $orders = [
        [
            'front' => 'demo-order-1', 'number' => 1, 'client' => 'Ana Souza', 'days' => 4,
            'items' => [
                ['demo-item-1', 'Vela Aromática de Lavanda', 2, 25.90, 250.500],
                ['demo-item-2', 'Vela de Baunilha', 1, 29.50, 300.000],
            ],
        ],
        [
            'front' => 'demo-order-2', 'number' => 2, 'client' => 'Carlos Mendes', 'days' => 11,
            'items' => [
                ['demo-item-3', 'Vela Decorativa Floral', 2, 34.90, 180.750],
            ],
        ],
        [
            'front' => 'demo-order-3', 'number' => 3, 'client' => 'Marcos Oliveira', 'days' => 40,
            'items' => [
                ['demo-item-4', 'Vela de Baunilha', 1, 29.50, 300.000],
            ],
        ],
    ];

    $clientAddress = [];
    foreach ($clients as $client) {
        $clientAddress[$client[1]] = $client[4] . ' - ' . $client[5];
    }

    foreach ($orders as $order) {
        $clientName = $order['client'];
        $orderInsert->execute([
            $order['front'],
            $order['number'],
            $clientIds[$clientName] ?? null,
            $clientName,
            $clientAddress[$clientName] ?? 'Não informado',
            demoOrderDate($order['days']),
            demoDate($order['days']),
        ]);
        $orderId = (int)$pdo->lastInsertId();

        foreach ($order['items'] as [$frontId, $productName, $quantity, $unitValue, $unitWeight]) {
            $itemInsert->execute([
                $frontId,
                $orderId,
                $productIds[$productName] ?? null,
                $productName,
                $quantity,
                $unitValue,
                $unitWeight,
                demoDate($order['days']),
            ]);
        }
    }

    // Uma entrada manual de peso deixa o exemplo do Controle Geral completo.
    $manual = $pdo->prepare(
        "INSERT INTO controle_geral (front_id, descricao, tipo_valor, valor, tipo_peso, peso, origem, criado_em)
         VALUES (?, ?, 'saida', ?, 'entrada', ?, 'manual', ?)"
    );
    $manual->execute([
        'demo-finance-1',
        'Compra de parafina',
        180.00,
        5000.000,
        demoDate(5),
    ]);

    $activities = [
        ['Dados de exemplo restaurados', 'Configurações', 0],
        ['Pedido #0001 registrado: Ana Souza', 'Pedidos', 4],
        ['Venda registrada: Venda para Ana Souza', 'Vendas', 1],
        ['Cliente cadastrado: Carlos Mendes', 'Clientes', 6],
        ['Produto cadastrado: Vela Decorativa Floral', 'Produtos', 10],
    ];

    foreach ($activities as [$description, $category, $daysAgo]) {
        activityInsert($pdo, $userId, $description, $category, (new DateTimeImmutable('now'))->modify("-{$daysAgo} days")->getTimestamp() * 1000);
    }
}

try {
    if (!in_array($action, ['clear', 'restore_demo'], true)) {
        jsonResponse(['ok' => false, 'message' => 'Ação de manutenção inválida.'], 422);
    }

    $pdo->beginTransaction();
    clearOperationalData($pdo);

    if ($action === 'restore_demo') {
        insertDemoData($pdo, $userId);
    }

    $pdo->commit();

    jsonResponse([
        'ok' => true,
        'message' => $action === 'restore_demo'
            ? 'Dados de exemplo restaurados com sucesso.'
            : 'Dados operacionais removidos com sucesso.',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'ok' => false,
        'message' => 'Não foi possível concluir a manutenção dos dados.',
        'error' => getenv('VST_DEBUG') === '1' ? $e->getMessage() : null,
    ], 500);
}
