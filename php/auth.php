<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

$method = requireMethod('GET', 'POST', 'DELETE');

try {
    $pdo = conectarBanco();

    if ($method === 'GET') {
        $user = currentUser();
        jsonResponse([
            'sucesso' => true,
            'autenticado' => $user !== null,
            'usuario' => $user,
        ]);
    }

    if ($method === 'DELETE') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                (bool) $params['secure'],
                (bool) $params['httponly']
            );
        }
        session_destroy();
        jsonResponse(['sucesso' => true]);
    }

    $data = jsonInput();
    $usuario = cleanString($data['usuario'] ?? '', 100);
    $senha = (string) ($data['senha'] ?? '');

    if ($usuario === '' || $senha === '') {
        jsonResponse(['sucesso' => false, 'mensagem' => 'Digite o usuário e a senha.'], 422);
    }

    $stmt = $pdo->prepare('SELECT id_usuario, nome, senha_hash FROM usuarios WHERE LOWER(nome) = LOWER(?) LIMIT 1');
    $stmt->execute([$usuario]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($senha, $row['senha_hash'])) {
        jsonResponse(['sucesso' => false, 'mensagem' => 'Usuário ou senha incorretos.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int) $row['id_usuario'];
    $_SESSION['usuario_nome'] = (string) $row['nome'];

    jsonResponse([
        'sucesso' => true,
        'usuario' => [
            'id' => (int) $row['id_usuario'],
            'nome' => (string) $row['nome'],
        ],
    ]);
} catch (Throwable $e) {
    handleApiException($e);
}
