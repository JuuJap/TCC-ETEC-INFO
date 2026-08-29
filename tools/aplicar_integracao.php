<?php
declare(strict_types=1);

/**
 * Execute uma única vez pela linha de comando, na RAIZ do projeto:
 * php tools/aplicar_integracao.php
 *
 * Ele adiciona backend-sync.js antes de common.js nas páginas administrativas.
 */

$root = dirname(__DIR__);
$pagesRoot = $root . DIRECTORY_SEPARATOR . 'pages';
$pages = [
    'home.html',
    'clientes.html',
    'produtos.html',
    'vendas.html',
    'pedidos.html',
    'financeiro.html',
    'configuracoes.html',
];

$tag = '<script src="../assets/js/backend-sync.js?v=1" defer></script>';

foreach ($pages as $page) {
    $path = $pagesRoot . DIRECTORY_SEPARATOR . $page;
    if (!is_file($path)) {
        echo "[AVISO] {$page} não encontrado.\n";
        continue;
    }

    $html = file_get_contents($path);
    if ($html === false) {
        echo "[ERRO] Não foi possível ler {$page}.\n";
        continue;
    }

    if (str_contains($html, 'assets/js/backend-sync.js')) {
        echo "[OK] {$page} já está integrado.\n";
        continue;
    }

    $pattern = '/(<script\s+src=["\']..\/assets\/js\/common\.js[^>]*><\/script>)/i';
    if (preg_match($pattern, $html)) {
        $html = preg_replace($pattern, $tag . PHP_EOL . '    $1', $html, 1);
    } else {
        $html = str_replace('</head>', "    {$tag}\n</head>", $html);
    }

    if (file_put_contents($path, $html) === false) {
        echo "[ERRO] Não foi possível alterar {$page}.\n";
        continue;
    }

    echo "[OK] Integração adicionada em {$page}.\n";
}

echo "\nConcluído. Agora importe o SQL e teste pelo Apache/XAMPP.\n";
