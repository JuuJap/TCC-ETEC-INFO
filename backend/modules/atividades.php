<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$usuario = exigirLogin();
$metodo = metodoPermitido('GET', 'DELETE');

try {
    $pdo = conectarBanco();

    if ($metodo === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id > 0) {
            $pdo->prepare('DELETE FROM atividades WHERE id_atividade=:id AND id_usuario=:usuario')->execute([':id' => $id, ':usuario' => $usuario['id']]);
        } else {
            $stmt = $pdo->prepare('DELETE FROM atividades WHERE id_usuario = :usuario');
            $stmt->execute([':usuario' => $usuario['id']]);
        }
        responder(['sucesso' => true]);
    }

    $limite = max(1, min(100, (int) ($_GET['limite'] ?? 20)));
    $stmt = $pdo->prepare("SELECT * FROM atividades WHERE id_usuario = :usuario OR id_usuario IS NULL ORDER BY criado_em DESC, id_atividade DESC LIMIT {$limite}");
    $stmt->execute([':usuario' => $usuario['id']]);
    $dados = array_map(static fn(array $r): array => [
        'id' => (string) $r['id_atividade'],
        'userId' => $r['id_usuario'] !== null ? (string) $r['id_usuario'] : null,
        'description' => (string) $r['descricao'],
        'category' => (string) $r['categoria'],
        'timestamp' => milissegundos($r['criado_em'] ?? null),
    ], $stmt->fetchAll());

    responder(['sucesso' => true, 'atividades' => $dados]);
} catch (Throwable $erro) {
    erroApi($erro);
}
