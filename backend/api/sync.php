<?php
declare(strict_types=1);
require_once __DIR__ . '/_bootstrap.php';

$userId = requireAuth();


function ensureFrontIds(PDO $pdo): void
{
    // Registros criados pelos endpoints modulares antigos podem não ter front_id.
    // Atribuímos IDs estáveis antes de hidratar o front para evitar duplicação
    // em futuras edições/sincronizações.
    $pdo->exec("UPDATE clientes SET front_id = CONCAT('client-db-', id_cliente) WHERE front_id IS NULL OR front_id = ''");
    $pdo->exec("UPDATE produtos SET front_id = CONCAT('product-db-', id_produto) WHERE front_id IS NULL OR front_id = ''");
    $pdo->exec("UPDATE vendas SET front_id = CONCAT('sale-db-', id_venda) WHERE front_id IS NULL OR front_id = ''");
    $pdo->exec("UPDATE pedidos SET front_id = CONCAT('order-db-', id_pedido) WHERE front_id IS NULL OR front_id = ''");
    $pdo->exec("UPDATE itens_pedido SET front_id = CONCAT('item-db-', id_item_pedido) WHERE front_id IS NULL OR front_id = ''");
    $pdo->exec("UPDATE controle_geral SET front_id = CONCAT('finance-db-', id_movimentacao) WHERE front_id IS NULL OR front_id = ''");
}

function loadClients(PDO $pdo): array
{
    $rows = $pdo->query('SELECT id_cliente, front_id, nome, email, telefone, endereco, cidade, status, criado_em FROM clientes ORDER BY criado_em DESC, id_cliente DESC')->fetchAll();
    return array_map(static fn(array $r): array => [
        'id' => $r['front_id'] ?: 'client-db-' . $r['id_cliente'],
        'name' => $r['nome'],
        'email' => $r['email'] ?? '',
        'phone' => $r['telefone'] ?? '',
        'address' => $r['endereco'] ?? '',
        'city' => $r['cidade'] ?? '',
        'status' => $r['status'],
        'createdAt' => msFromSqlDate($r['criado_em']),
    ], $rows);
}

function loadProducts(PDO $pdo): array
{
    $rows = $pdo->query('SELECT id_produto, front_id, nome, tipo, cor, valor_unitario, peso_unitario, caracteristica, criado_em FROM produtos ORDER BY criado_em DESC, id_produto DESC')->fetchAll();
    return array_map(static fn(array $r): array => [
        'id' => $r['front_id'] ?: 'product-db-' . $r['id_produto'],
        'name' => $r['nome'],
        'type' => $r['tipo'] ?? '',
        'color' => $r['cor'] ?? '',
        'unitValue' => (float)$r['valor_unitario'],
        'unitWeight' => (float)$r['peso_unitario'],
        'characteristic' => $r['caracteristica'] ?? '',
        'createdAt' => msFromSqlDate($r['criado_em']),
    ], $rows);
}

function loadSales(PDO $pdo): array
{
    $rows = $pdo->query('SELECT id_venda, front_id, descricao, valor, criado_em FROM vendas ORDER BY criado_em DESC, id_venda DESC')->fetchAll();
    return array_map(static fn(array $r): array => [
        'id' => $r['front_id'] ?: 'sale-db-' . $r['id_venda'],
        'description' => $r['descricao'],
        'value' => (float)$r['valor'],
        'createdAt' => msFromSqlDate($r['criado_em']),
    ], $rows);
}

function loadOrders(PDO $pdo): array
{
    $orders = $pdo->query('SELECT id_pedido, front_id, numero_pedido, cliente_nome, endereco_entrega, data_pedido, valor_total, peso_total, criado_em, atualizado_em FROM pedidos ORDER BY numero_pedido DESC')->fetchAll();
    $itemStmt = $pdo->prepare('SELECT id_item_pedido, front_id, descricao, quantidade, valor_unitario, peso_unitario FROM itens_pedido WHERE id_pedido = ? ORDER BY id_item_pedido ASC');

    $result = [];
    foreach ($orders as $order) {
        $itemStmt->execute([(int)$order['id_pedido']]);
        $items = [];
        foreach ($itemStmt->fetchAll() as $item) {
            $quantity = (int)$item['quantidade'];
            $unitValue = (float)$item['valor_unitario'];
            $unitWeight = (float)$item['peso_unitario'];
            $items[] = [
                'id' => $item['front_id'] ?: 'item-db-' . $item['id_item_pedido'],
                'description' => $item['descricao'],
                'quantity' => $quantity,
                'unitValue' => $unitValue,
                'unitWeight' => $unitWeight,
                'totalValue' => $quantity * $unitValue,
                'totalWeight' => $quantity * $unitWeight,
            ];
        }

        $result[] = [
            'id' => $order['front_id'] ?: 'order-db-' . $order['id_pedido'],
            'number' => (int)$order['numero_pedido'],
            'client' => $order['cliente_nome'],
            'address' => $order['endereco_entrega'],
            'date' => sqlDateToFront($order['data_pedido']),
            'items' => $items,
            'totalValue' => (float)$order['valor_total'],
            'totalWeight' => (float)$order['peso_total'],
            'createdAt' => msFromSqlDate($order['criado_em']),
            'updatedAt' => msFromSqlDate($order['atualizado_em']),
        ];
    }
    return $result;
}

function loadFinance(PDO $pdo): array
{
    $sql = "SELECT cg.id_movimentacao, cg.front_id, cg.descricao, cg.tipo_valor, cg.valor, cg.tipo_peso, cg.peso, cg.origem, cg.criado_em,
                   v.front_id AS venda_front_id, p.front_id AS pedido_front_id
              FROM controle_geral cg
         LEFT JOIN vendas v ON v.id_venda = cg.id_venda
         LEFT JOIN pedidos p ON p.id_pedido = cg.id_pedido
          ORDER BY cg.criado_em DESC, cg.id_movimentacao DESC";
    $rows = $pdo->query($sql)->fetchAll();

    return array_map(static function (array $r): array {
        $source = match ($r['origem']) {
            'venda' => 'sale',
            'pedido' => 'order',
            default => 'manual',
        };
        $sourceId = $source === 'sale'
            ? ($r['venda_front_id'] ?? null)
            : ($source === 'order' ? ($r['pedido_front_id'] ?? null) : null);

        $id = $r['front_id'];
        if (!$id) {
            $id = $source === 'sale' && $sourceId
                ? 'finance-sale-' . $sourceId
                : ($source === 'order' && $sourceId
                    ? 'finance-order-' . $sourceId
                    : 'finance-db-' . $r['id_movimentacao']);
        }

        return [
            'id' => $id,
            'type' => $r['tipo_valor'],
            'description' => $r['descricao'],
            'value' => (float)$r['valor'],
            'weight' => (float)$r['peso'],
            'weightType' => $r['tipo_peso'],
            'createdAt' => msFromSqlDate($r['criado_em']),
            'source' => $source,
            'sourceId' => $sourceId,
        ];
    }, $rows);
}

function loadDashboard(PDO $pdo, int $userId): array
{
    $summary = $pdo->query('SELECT * FROM vw_dashboard_resumo LIMIT 1')->fetch() ?: [];
    $stmt = $pdo->prepare('SELECT descricao, categoria, criado_em FROM atividades WHERE id_usuario = ? OR id_usuario IS NULL ORDER BY criado_em DESC, id_atividade DESC LIMIT 20');
    $stmt->execute([$userId]);
    $activities = array_map(static fn(array $r): array => [
        'description' => $r['descricao'],
        'category' => $r['categoria'],
        'timestamp' => msFromSqlDate($r['criado_em']),
    ], $stmt->fetchAll());

    return [
        'schemaVersion' => 4,
        'clients' => (int)($summary['clientes_cadastrados'] ?? 0),
        'products' => (int)($summary['produtos_cadastrados'] ?? 0),
        'sales' => (int)($summary['vendas_realizadas'] ?? 0),
        'revenue' => (float)($summary['faturamento_vendas'] ?? 0),
        'orders' => (int)($summary['pedidos_registrados'] ?? 0),
        'activities' => $activities,
    ];
}

function loadCompany(PDO $pdo): array
{
    $row = $pdo->query('SELECT nome_empresa, telefone, endereco, cnpj FROM configuracoes_empresa WHERE id_configuracao = 1')->fetch() ?: [];
    return [
        'name' => $row['nome_empresa'] ?? 'Velas S. Tomé',
        'phone' => $row['telefone'] ?? '',
        'address' => $row['endereco'] ?? '',
        'cnpj' => $row['cnpj'] ?? '',
    ];
}

function syncClients(PDO $pdo, array $clients): void
{
    $pdo->beginTransaction();
    try {
        $find = $pdo->prepare('SELECT id_cliente FROM clientes WHERE front_id = ? LIMIT 1');
        $insert = $pdo->prepare('INSERT INTO clientes (front_id, nome, email, telefone, endereco, cidade, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $update = $pdo->prepare('UPDATE clientes SET nome=?, email=?, telefone=?, endereco=?, cidade=?, status=? WHERE id_cliente=?');
        $ids = [];

        foreach ($clients as $client) {
            if (!is_array($client)) continue;
            $frontId = validFrontId($client['id'] ?? null, 'client');
            $name = normalizeString($client['name'] ?? '', 100);
            if ($name === '') continue;
            $status = ($client['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';
            $ids[] = $frontId;

            $find->execute([$frontId]);
            $existing = $find->fetchColumn();
            if ($existing) {
                $update->execute([
                    $name,
                    nullableString($client['email'] ?? null, 120),
                    nullableString($client['phone'] ?? null, 20),
                    nullableString($client['address'] ?? null, 180),
                    nullableString($client['city'] ?? null, 80),
                    $status,
                    (int)$existing,
                ]);
            } else {
                $insert->execute([
                    $frontId,
                    $name,
                    nullableString($client['email'] ?? null, 120),
                    nullableString($client['phone'] ?? null, 20),
                    nullableString($client['address'] ?? null, 180),
                    nullableString($client['city'] ?? null, 80),
                    $status,
                    sqlDateTimeFromMs($client['createdAt'] ?? null),
                ]);
            }
        }

        if ($ids) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM clientes WHERE front_id IS NOT NULL AND front_id NOT IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            $pdo->exec('DELETE FROM clientes WHERE front_id IS NOT NULL');
        }

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function syncProducts(PDO $pdo, array $products): void
{
    $pdo->beginTransaction();
    try {
        $find = $pdo->prepare('SELECT id_produto FROM produtos WHERE front_id = ? LIMIT 1');
        $insert = $pdo->prepare('INSERT INTO produtos (front_id, nome, tipo, cor, valor_unitario, peso_unitario, caracteristica, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $update = $pdo->prepare('UPDATE produtos SET nome=?, tipo=?, cor=?, valor_unitario=?, peso_unitario=?, caracteristica=? WHERE id_produto=?');
        $ids = [];

        foreach ($products as $product) {
            if (!is_array($product)) continue;
            $frontId = validFrontId($product['id'] ?? null, 'product');
            $name = normalizeString($product['name'] ?? '', 120);
            $weight = (float)($product['unitWeight'] ?? 0);
            if ($name === '' || $weight <= 0) continue;
            $ids[] = $frontId;

            $payload = [
                $name,
                nullableString($product['type'] ?? null, 80),
                nullableString($product['color'] ?? null, 60),
                max(0, (float)($product['unitValue'] ?? 0)),
                $weight,
                nullableString($product['characteristic'] ?? null, 150),
            ];

            $find->execute([$frontId]);
            $existing = $find->fetchColumn();
            if ($existing) {
                $update->execute([...$payload, (int)$existing]);
            } else {
                $insert->execute([
                    $frontId,
                    ...$payload,
                    sqlDateTimeFromMs($product['createdAt'] ?? null),
                ]);
            }
        }

        if ($ids) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM produtos WHERE front_id IS NOT NULL AND front_id NOT IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            $pdo->exec('DELETE FROM produtos WHERE front_id IS NOT NULL');
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function syncSales(PDO $pdo, array $sales): void
{
    $pdo->beginTransaction();
    try {
        $find = $pdo->prepare('SELECT id_venda FROM vendas WHERE front_id = ? LIMIT 1');
        $insert = $pdo->prepare('INSERT INTO vendas (front_id, descricao, valor, criado_em) VALUES (?, ?, ?, ?)');
        $update = $pdo->prepare('UPDATE vendas SET descricao=?, valor=? WHERE id_venda=?');
        $ids = [];

        foreach ($sales as $sale) {
            if (!is_array($sale)) continue;
            $frontId = validFrontId($sale['id'] ?? null, 'sale');
            $description = normalizeString($sale['description'] ?? '', 120);
            $value = (float)($sale['value'] ?? 0);
            if ($description === '' || $value <= 0) continue;
            $ids[] = $frontId;

            $find->execute([$frontId]);
            $existing = $find->fetchColumn();
            if ($existing) {
                $update->execute([$description, $value, (int)$existing]);
            } else {
                $insert->execute([$frontId, $description, $value, sqlDateTimeFromMs($sale['createdAt'] ?? null)]);
            }
        }

        if ($ids) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM vendas WHERE front_id IS NOT NULL AND front_id NOT IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            $pdo->exec('DELETE FROM vendas WHERE front_id IS NOT NULL');
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function syncOrders(PDO $pdo, array $orders): void
{
    $pdo->beginTransaction();
    try {
        $findOrder = $pdo->prepare('SELECT id_pedido FROM pedidos WHERE front_id = ? LIMIT 1');
        $findClient = $pdo->prepare('SELECT id_cliente FROM clientes WHERE LOWER(nome) = LOWER(?) ORDER BY id_cliente ASC LIMIT 1');
        $findProduct = $pdo->prepare('SELECT id_produto FROM produtos WHERE LOWER(nome) = LOWER(?) ORDER BY id_produto ASC LIMIT 1');
        $insertOrder = $pdo->prepare('INSERT INTO pedidos (front_id, numero_pedido, id_cliente, cliente_nome, endereco_entrega, data_pedido, valor_total, peso_total, criado_em) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)');
        $updateOrder = $pdo->prepare('UPDATE pedidos SET numero_pedido=?, id_cliente=?, cliente_nome=?, endereco_entrega=?, data_pedido=? WHERE id_pedido=?');
        $deleteItems = $pdo->prepare('DELETE FROM itens_pedido WHERE id_pedido = ?');
        $insertItem = $pdo->prepare('INSERT INTO itens_pedido (front_id, id_pedido, id_produto, descricao, quantidade, valor_unitario, peso_unitario) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $ids = [];

        foreach ($orders as $order) {
            if (!is_array($order)) continue;
            $frontId = validFrontId($order['id'] ?? null, 'order');
            $number = max(1, (int)($order['number'] ?? 0));
            $clientName = normalizeString($order['client'] ?? '', 120);
            $address = normalizeString($order['address'] ?? '', 180);
            $date = frontDateToSql($order['date'] ?? '');
            $items = is_array($order['items'] ?? null) ? $order['items'] : [];
            if ($clientName === '' || $address === '' || !$items) continue;
            $ids[] = $frontId;

            $findClient->execute([$clientName]);
            $clientId = $findClient->fetchColumn();
            $clientId = $clientId ? (int)$clientId : null;

            $findOrder->execute([$frontId]);
            $orderId = $findOrder->fetchColumn();
            if ($orderId) {
                $orderId = (int)$orderId;
                $updateOrder->execute([$number, $clientId, $clientName, $address, $date, $orderId]);
            } else {
                $insertOrder->execute([
                    $frontId,
                    $number,
                    $clientId,
                    $clientName,
                    $address,
                    $date,
                    sqlDateTimeFromMs($order['createdAt'] ?? null),
                ]);
                $orderId = (int)$pdo->lastInsertId();
            }

            $deleteItems->execute([$orderId]);
            foreach ($items as $item) {
                if (!is_array($item)) continue;
                $description = normalizeString($item['description'] ?? '', 140);
                $quantity = max(1, (int)($item['quantity'] ?? 1));
                $unitValue = (float)($item['unitValue'] ?? 0);
                $unitWeight = (float)($item['unitWeight'] ?? 0);
                if ($description === '' || $unitValue <= 0 || $unitWeight <= 0) continue;

                $findProduct->execute([$description]);
                $productId = $findProduct->fetchColumn();
                $productId = $productId ? (int)$productId : null;

                $insertItem->execute([
                    validFrontId($item['id'] ?? null, 'item'),
                    $orderId,
                    $productId,
                    $description,
                    $quantity,
                    $unitValue,
                    $unitWeight,
                ]);
            }
        }

        if ($ids) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM pedidos WHERE front_id IS NOT NULL AND front_id NOT IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            $pdo->exec('DELETE FROM pedidos WHERE front_id IS NOT NULL');
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function syncFinance(PDO $pdo, array $movements): void
{
    $manual = array_values(array_filter($movements, static fn($m): bool => is_array($m) && (($m['source'] ?? 'manual') === 'manual')));
    $pdo->beginTransaction();
    try {
        $find = $pdo->prepare("SELECT id_movimentacao FROM controle_geral WHERE origem='manual' AND front_id = ? LIMIT 1");
        $insert = $pdo->prepare("INSERT INTO controle_geral (front_id, descricao, tipo_valor, valor, tipo_peso, peso, origem, criado_em) VALUES (?, ?, ?, ?, ?, ?, 'manual', ?)");
        $update = $pdo->prepare("UPDATE controle_geral SET descricao=?, tipo_valor=?, valor=?, tipo_peso=?, peso=? WHERE id_movimentacao=? AND origem='manual'");
        $ids = [];

        foreach ($manual as $movement) {
            $frontId = validFrontId($movement['id'] ?? null, 'finance');
            $description = normalizeString($movement['description'] ?? '', 180);
            $type = ($movement['type'] ?? 'entrada') === 'saida' ? 'saida' : 'entrada';
            $weightType = ($movement['weightType'] ?? 'entrada') === 'saida' ? 'saida' : 'entrada';
            $value = max(0, (float)($movement['value'] ?? 0));
            $weight = max(0, (float)($movement['weight'] ?? 0));
            if ($description === '' || ($value <= 0 && $weight <= 0)) continue;
            $ids[] = $frontId;

            $find->execute([$frontId]);
            $existing = $find->fetchColumn();
            if ($existing) {
                $update->execute([$description, $type, $value, $weightType, $weight, (int)$existing]);
            } else {
                $insert->execute([$frontId, $description, $type, $value, $weightType, $weight, sqlDateTimeFromMs($movement['createdAt'] ?? null)]);
            }
        }

        if ($ids) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM controle_geral WHERE origem='manual' AND front_id IS NOT NULL AND front_id NOT IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            $pdo->exec("DELETE FROM controle_geral WHERE origem='manual' AND front_id IS NOT NULL");
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function syncDashboard(PDO $pdo, int $userId, array $state): void
{
    $activities = is_array($state['activities'] ?? null) ? array_slice($state['activities'], 0, 20) : [];
    $pdo->beginTransaction();
    try {
        $delete = $pdo->prepare('DELETE FROM atividades WHERE id_usuario = ?');
        $delete->execute([$userId]);
        foreach ($activities as $activity) {
            if (!is_array($activity)) continue;
            $description = normalizeString($activity['description'] ?? '', 255);
            $category = normalizeString($activity['category'] ?? '', 60);
            if ($description === '' || $category === '') continue;
            activityInsert($pdo, $userId, $description, $category, $activity['timestamp'] ?? null);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

function syncCompany(PDO $pdo, int $userId, array $settings): void
{
    $name = normalizeString($settings['name'] ?? 'Velas S. Tomé', 100);
    if ($name === '') $name = 'Velas S. Tomé';
    $stmt = $pdo->prepare('INSERT INTO configuracoes_empresa (id_configuracao, nome_empresa, telefone, endereco, cnpj) VALUES (1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nome_empresa=VALUES(nome_empresa), telefone=VALUES(telefone), endereco=VALUES(endereco), cnpj=VALUES(cnpj)');
    $stmt->execute([
        $name,
        nullableString($settings['phone'] ?? null, 30),
        nullableString($settings['address'] ?? null, 180),
        nullableString($settings['cnpj'] ?? null, 30),
    ]);

    activityInsert(
        $pdo,
        $userId,
        'Dados da empresa atualizados',
        'Configurações'
    );
}

ensureFrontIds($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        jsonResponse([
            'ok' => true,
            'user' => [
                'id' => $userId,
                'name' => (string)($_SESSION['usuario_nome'] ?? ''),
            ],
            'data' => [
                'velasClientesTemporarios' => loadClients($pdo),
                'velasProdutosTemporarios' => loadProducts($pdo),
                'velasVendasTemporarias' => loadSales($pdo),
                'velasPedidosTemporarios' => loadOrders($pdo),
                'velasFinanceiroTemporario' => loadFinance($pdo),
                'velasDashboardTemporario' => loadDashboard($pdo, $userId),
                'velasEmpresaConfiguracoes' => loadCompany($pdo),
            ],
        ]);
    } catch (Throwable $e) {
        jsonResponse([
            'ok' => false,
            'message' => 'Falha ao carregar os dados do banco.',
            'error' => getenv('VST_DEBUG') === '1' ? $e->getMessage() : null,
        ], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['ok' => false, 'message' => 'Método não permitido.'], 405);
}

$body = requestBody();
$key = (string)($body['key'] ?? '');
$data = $body['data'] ?? null;

try {
    switch ($key) {
        case 'velasClientesTemporarios':
            syncClients($pdo, is_array($data) ? $data : []);
            break;
        case 'velasProdutosTemporarios':
            syncProducts($pdo, is_array($data) ? $data : []);
            break;
        case 'velasVendasTemporarias':
            syncSales($pdo, is_array($data) ? $data : []);
            break;
        case 'velasPedidosTemporarios':
            syncOrders($pdo, is_array($data) ? $data : []);
            break;
        case 'velasFinanceiroTemporario':
            syncFinance($pdo, is_array($data) ? $data : []);
            break;
        case 'velasDashboardTemporario':
            syncDashboard($pdo, $userId, is_array($data) ? $data : []);
            break;
        case 'velasEmpresaConfiguracoes':
            syncCompany($pdo, $userId, is_array($data) ? $data : []);
            break;
        default:
            jsonResponse(['ok' => false, 'message' => 'Chave de sincronização inválida.'], 422);
    }

    jsonResponse(['ok' => true, 'message' => 'Dados sincronizados.']);
} catch (Throwable $e) {
    jsonResponse([
        'ok' => false,
        'message' => 'Falha ao sincronizar os dados.',
        'error' => getenv('VST_DEBUG') === '1' ? $e->getMessage() : null,
    ], 500);
}
