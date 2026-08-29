<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'POST', 'PUT', 'DELETE');

function buscarPedido(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id_pedido=:id');
    $stmt->execute([':id' => $id]);
    $pedido = $stmt->fetch();
    if (!$pedido) return null;

    $itensStmt = $pdo->prepare('SELECT * FROM itens_pedido WHERE id_pedido=:id ORDER BY id_item_pedido');
    $itensStmt->execute([':id' => $id]);
    $itens = [];

    foreach ($itensStmt->fetchAll() as $r) {
        $quantidade = (int) $r['quantidade'];
        $valor = (float) $r['valor_unitario'];
        $peso = (float) $r['peso_unitario'];
        $itens[] = [
            'id' => (string) $r['id_item_pedido'],
            'productId' => $r['id_produto'] !== null ? (string) $r['id_produto'] : null,
            'description' => (string) $r['descricao'],
            'quantity' => $quantidade,
            'unitValue' => $valor,
            'unitWeight' => $peso,
            'totalValue' => $quantidade * $valor,
            'totalWeight' => $quantidade * $peso,
        ];
    }

    return [
        'id' => (string) $pedido['id_pedido'],
        'number' => (int) $pedido['numero_pedido'],
        'clientId' => $pedido['id_cliente'] !== null ? (string) $pedido['id_cliente'] : null,
        'client' => (string) $pedido['cliente_nome'],
        'address' => (string) $pedido['endereco_entrega'],
        'date' => dataParaFront((string) $pedido['data_pedido']),
        'items' => $itens,
        'totalValue' => (float) $pedido['valor_total'],
        'totalWeight' => (float) $pedido['peso_total'],
        'createdAt' => milissegundos($pedido['criado_em'] ?? null),
        'updatedAt' => milissegundos($pedido['atualizado_em'] ?? null),
    ];
}

function validarItens(array $itens): array
{
    if ($itens === []) {
        responder(['sucesso' => false, 'mensagem' => 'Adicione pelo menos um item ao pedido.'], 422);
    }

    $limpos = [];
    foreach ($itens as $indice => $item) {
        if (!is_array($item)) responder(['sucesso' => false, 'mensagem' => 'Item de pedido inválido.'], 422);

        $descricao = texto($item['description'] ?? $item['descricao'] ?? '', 140);
        $quantidade = max(1, (int) ($item['quantity'] ?? $item['quantidade'] ?? 1));
        $valor = decimal($item['unitValue'] ?? $item['valor_unitario'] ?? 0);
        $peso = decimal($item['unitWeight'] ?? $item['peso_unitario'] ?? 0);
        $produtoId = (int) ($item['productId'] ?? $item['id_produto'] ?? 0);

        if ($descricao === '' || $valor <= 0 || $peso <= 0) {
            responder(['sucesso' => false, 'mensagem' => 'O item ' . ($indice + 1) . ' possui dados inválidos.'], 422);
        }

        $limpos[] = [
            'descricao' => $descricao,
            'quantidade' => $quantidade,
            'valor' => $valor,
            'peso' => $peso,
            'produtoId' => $produtoId > 0 ? $produtoId : null,
        ];
    }

    return $limpos;
}

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id > 0) {
            $pedido = buscarPedido($pdo, $id);
            if (!$pedido) responder(['sucesso' => false, 'mensagem' => 'Pedido não encontrado.'], 404);
            responder(['sucesso' => true, 'pedido' => $pedido]);
        }

        $ids = $pdo->query('SELECT id_pedido FROM pedidos ORDER BY criado_em DESC, id_pedido DESC')->fetchAll(PDO::FETCH_COLUMN);
        $pedidos = [];
        foreach ($ids as $pedidoId) {
            $pedido = buscarPedido($pdo, (int) $pedidoId);
            if ($pedido) $pedidos[] = $pedido;
        }
        $proximo = (int) $pdo->query('SELECT COALESCE(MAX(numero_pedido),0)+1 FROM pedidos')->fetchColumn();
        responder(['sucesso' => true, 'pedidos' => $pedidos, 'proximoNumero' => $proximo]);
    }

    $dados = entrada();

    if ($metodo === 'DELETE') {
        $id = (int) ($_GET['id'] ?? $dados['id'] ?? 0);
        if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Pedido inválido.'], 422);

        $stmt = $pdo->prepare('SELECT numero_pedido, cliente_nome FROM pedidos WHERE id_pedido=:id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) responder(['sucesso' => false, 'mensagem' => 'Pedido não encontrado.'], 404);

        // itens_pedido e controle_geral são removidos pelas FKs ON DELETE CASCADE.
        $pdo->prepare('DELETE FROM pedidos WHERE id_pedido=:id')->execute([':id' => $id]);
        registrarAtividade($pdo, $usuario['id'], sprintf('Pedido #%04d excluído: %s', (int) $row['numero_pedido'], $row['cliente_nome']), 'Pedidos');
        responder(['sucesso' => true, 'mensagem' => 'Pedido removido.']);
    }

    $id = (int) ($dados['id'] ?? $dados['id_pedido'] ?? 0);
    $cliente = texto($dados['client'] ?? $dados['cliente_nome'] ?? '', 120);
    $endereco = texto($dados['address'] ?? $dados['endereco_entrega'] ?? '', 180);
    $data = dataParaSql($dados['date'] ?? $dados['data_pedido'] ?? '');
    $itens = validarItens(is_array($dados['items'] ?? null) ? $dados['items'] : (is_array($dados['itens'] ?? null) ? $dados['itens'] : []));

    if ($cliente === '') responder(['sucesso' => false, 'mensagem' => 'Informe o cliente.'], 422);
    if ($endereco === '') responder(['sucesso' => false, 'mensagem' => 'Informe o endereço de entrega.'], 422);
    if ($data === null) responder(['sucesso' => false, 'mensagem' => 'Informe uma data válida.'], 422);

    $clienteId = (int) ($dados['clientId'] ?? $dados['id_cliente'] ?? 0);
    if ($clienteId <= 0) $clienteId = idClientePorNome($pdo, $cliente) ?? 0;
    $clienteIdSql = $clienteId > 0 ? $clienteId : null;

    $pdo->beginTransaction();
    try {
        if ($metodo === 'POST') {
            // O número exibido pode vir do front; se não vier, o próximo é calculado.
            $numero = (int) ($dados['number'] ?? $dados['numero_pedido'] ?? 0);
            if ($numero <= 0) {
                $numero = (int) $pdo->query('SELECT COALESCE(MAX(numero_pedido),0)+1 FROM pedidos')->fetchColumn();
            }

            $stmt = $pdo->prepare(
                'INSERT INTO pedidos (numero_pedido,id_cliente,cliente_nome,endereco_entrega,data_pedido)
                 VALUES (:numero,:clienteId,:cliente,:endereco,:data)'
            );
            $stmt->execute([
                ':numero' => $numero,
                ':clienteId' => $clienteIdSql,
                ':cliente' => $cliente,
                ':endereco' => $endereco,
                ':data' => $data,
            ]);
            $id = (int) $pdo->lastInsertId();
            $atividade = sprintf('Pedido #%04d registrado: %s', $numero, $cliente);
            $statusHttp = 201;
        } else {
            if ($id <= 0) responder(['sucesso' => false, 'mensagem' => 'Pedido inválido.'], 422);
            $stmt = $pdo->prepare('SELECT numero_pedido FROM pedidos WHERE id_pedido=:id');
            $stmt->execute([':id' => $id]);
            $numero = $stmt->fetchColumn();
            if ($numero === false) responder(['sucesso' => false, 'mensagem' => 'Pedido não encontrado.'], 404);

            $stmt = $pdo->prepare(
                'UPDATE pedidos SET id_cliente=:clienteId, cliente_nome=:cliente, endereco_entrega=:endereco, data_pedido=:data
                 WHERE id_pedido=:id'
            );
            $stmt->execute([
                ':clienteId' => $clienteIdSql,
                ':cliente' => $cliente,
                ':endereco' => $endereco,
                ':data' => $data,
                ':id' => $id,
            ]);

            // As triggers recalculam os totais conforme os itens são apagados/recriados.
            $pdo->prepare('DELETE FROM itens_pedido WHERE id_pedido=:id')->execute([':id' => $id]);
            $atividade = sprintf('Pedido #%04d atualizado: %s', (int) $numero, $cliente);
            $statusHttp = 200;
        }

        $insert = $pdo->prepare(
            'INSERT INTO itens_pedido (id_pedido,id_produto,descricao,quantidade,valor_unitario,peso_unitario)
             VALUES (:pedido,:produto,:descricao,:quantidade,:valor,:peso)'
        );

        foreach ($itens as $item) {
            $produtoId = $item['produtoId'];
            if ($produtoId === null) {
                $produtoId = idProdutoPorNome($pdo, $item['descricao']);
            }
            $insert->execute([
                ':pedido' => $id,
                ':produto' => $produtoId,
                ':descricao' => $item['descricao'],
                ':quantidade' => $item['quantidade'],
                ':valor' => $item['valor'],
                ':peso' => $item['peso'],
            ]);
        }

        // O SQL já possui triggers que recalculam pedidos e sincronizam controle_geral.
        registrarAtividade($pdo, $usuario['id'], $atividade, 'Pedidos');
        $pdo->commit();
    } catch (Throwable $erroInterno) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $erroInterno;
    }

    $pedido = buscarPedido($pdo, $id);
    responder(['sucesso' => true, 'pedido' => $pedido], $statusHttp);
} catch (Throwable $erro) {
    erroApi($erro);
}
