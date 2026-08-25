<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$user = requireAuth();
$method = requireMethod('GET', 'PUT');

try {
    $pdo = conectarBanco();
    if ($method === 'GET') {
        $settings = $pdo->query('SELECT * FROM configuracoes_empresa WHERE id_configuracao=1')->fetch();
        $summary = $pdo->query('SELECT * FROM vw_dashboard_resumo')->fetch() ?: [];
        jsonResponse(['sucesso'=>true,
            'configuracoes'=>[
                'name'=>$settings['nome_empresa'] ?? 'Velas S. Tomé',
                'phone'=>$settings['telefone'] ?? '',
                'address'=>$settings['endereco'] ?? '',
                'cnpj'=>$settings['cnpj'] ?? '',
            ],
            'contadores'=>[
                'clients'=>(int)($summary['clientes_cadastrados'] ?? 0),
                'products'=>(int)($summary['produtos_cadastrados'] ?? 0),
                'sales'=>(int)($summary['vendas_realizadas'] ?? 0),
                'orders'=>(int)($summary['pedidos_registrados'] ?? 0),
            ]
        ]);
    }

    $data = jsonInput();
    $name = cleanString($data['name'] ?? 'Velas S. Tomé', 100) ?: 'Velas S. Tomé';
    $phone = nullableString($data['phone'] ?? '', 30);
    $address = nullableString($data['address'] ?? '', 180);
    $cnpj = nullableString($data['cnpj'] ?? '', 30);
    $stmt = $pdo->prepare('UPDATE configuracoes_empresa SET nome_empresa=?,telefone=?,endereco=?,cnpj=? WHERE id_configuracao=1');
    $stmt->execute([$name,$phone,$address,$cnpj]);
    addActivity($pdo, $user['id'], 'Dados da empresa atualizados', 'Configurações');
    jsonResponse(['sucesso'=>true,'configuracoes'=>['name'=>$name,'phone'=>$phone ?? '','address'=>$address ?? '','cnpj'=>$cnpj ?? '']]);
} catch (Throwable $e) { handleApiException($e); }
