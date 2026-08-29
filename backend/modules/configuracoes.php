<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'PUT', 'POST');

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET') {
        $r = $pdo->query(
            'SELECT * FROM configuracoes_empresa WHERE id_configuracao = 1'
        )->fetch();

        responder([
            'sucesso' => true,
            'configuracoes' => [
                'name' => (string)($r['nome_empresa'] ?? 'Velas S. Tomé'),
                'phone' => $r['telefone'] ?? '',
                'address' => $r['endereco'] ?? '',
                'cnpj' => $r['cnpj'] ?? '',
                'updatedAt' => milissegundos($r['atualizado_em'] ?? null),
            ]
        ]);
    }

    $dados = entrada();

    $nome = texto(
        $dados['name']
        ?? $dados['nome_empresa']
        ?? 'Velas S. Tomé',
        100
    );

    $telefone = textoOuNull(
        $dados['phone']
        ?? $dados['telefone']
        ?? '',
        30
    );

    $endereco = textoOuNull(
        $dados['address']
        ?? $dados['endereco']
        ?? '',
        180
    );

    $cnpj = textoOuNull(
        $dados['cnpj'] ?? '',
        30
    );

    if ($nome === '') {
        $nome = 'Velas S. Tomé';
    }

    $stmt = $pdo->prepare(
        'INSERT INTO configuracoes_empresa
            (id_configuracao, nome_empresa, telefone, endereco, cnpj)
         VALUES
            (1, :nome, :telefone, :endereco, :cnpj)
         ON DUPLICATE KEY UPDATE
            nome_empresa = VALUES(nome_empresa),
            telefone = VALUES(telefone),
            endereco = VALUES(endereco),
            cnpj = VALUES(cnpj)'
    );

    $stmt->execute([
        ':nome' => $nome,
        ':telefone' => $telefone,
        ':endereco' => $endereco,
        ':cnpj' => $cnpj,
    ]);

    registrarAtividade(
        $pdo,
        $usuario['id'],
        'Dados da empresa atualizados',
        'Configurações'
    );

    responder([
        'sucesso' => true,
        'configuracoes' => [
            'name' => $nome,
            'phone' => $telefone ?? '',
            'address' => $endereco ?? '',
            'cnpj' => $cnpj ?? '',
        ]
    ]);

} catch (Throwable $erro) {
    erroApi($erro);
}
