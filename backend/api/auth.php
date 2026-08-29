<?php
declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

const VST_PASSWORD_MIN_LENGTH = 8;
const VST_PASSWORD_MAX_LENGTH = 255;

$action = strtolower((string)($_GET['action'] ?? 'me'));

if ($action === 'me') {
    $userId = currentUserIdOrNull();

    if (!$userId) {
        jsonResponse(['ok' => false, 'authenticated' => false], 401);
    }

    jsonResponse([
        'ok' => true,
        'authenticated' => true,
        'user' => [
            'id' => $userId,
            'name' => (string)($_SESSION['usuario_nome'] ?? ''),
        ],
    ]);
}

if (requestMethod() !== 'POST') {
    header('Allow: POST');
    jsonResponse(['ok' => false, 'message' => 'Método não permitido.'], 405);
}

if ($action === 'logout') {
    destroyCurrentSession();
    jsonResponse(['ok' => true, 'message' => 'Logout realizado.']);
}

if ($action === 'change-password') {
    $userId = requireAuth();
    $body = requestBody();

    $currentPassword = (string)($body['senha_atual'] ?? '');
    $newPassword = (string)($body['nova_senha'] ?? '');

    if ($currentPassword === '' || $newPassword === '') {
        jsonResponse(
            ['ok' => false, 'message' => 'Informe a senha atual e a nova senha.'],
            422
        );
    }

    $newLength = strlen($newPassword);

    if ($newLength < VST_PASSWORD_MIN_LENGTH) {
        jsonResponse(
            ['ok' => false, 'message' => 'A nova senha deve ter pelo menos 8 caracteres.'],
            422
        );
    }

    if ($newLength > VST_PASSWORD_MAX_LENGTH) {
        jsonResponse(
            ['ok' => false, 'message' => 'A nova senha é muito longa.'],
            422
        );
    }

    if (hash_equals($currentPassword, $newPassword)) {
        jsonResponse(
            ['ok' => false, 'message' => 'A nova senha deve ser diferente da senha atual.'],
            422
        );
    }

    $stmt = $pdo->prepare(
        'SELECT senha_hash FROM usuarios WHERE id_usuario = ? LIMIT 1'
    );
    $stmt->execute([$userId]);

    $currentHash = $stmt->fetchColumn();

    if (
        !$currentHash
        || !password_verify($currentPassword, (string)$currentHash)
    ) {
        jsonResponse(
            ['ok' => false, 'message' => 'A senha atual está incorreta.'],
            401
        );
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $update = $pdo->prepare(
        'UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?'
    );
    $update->execute([$newHash, $userId]);

    activityInsert(
        $pdo,
        $userId,
        'Senha da conta alterada',
        'Conta'
    );

    session_regenerate_id(true);
    $_SESSION['ultima_atividade'] = time();

    jsonResponse(['ok' => true, 'message' => 'Senha alterada com sucesso.']);
}

$body = requestBody();

$usuario = normalizeString($body['usuario'] ?? '', 100);
$senha = (string)($body['senha'] ?? '');

if ($usuario === '' || $senha === '') {
    jsonResponse(['ok' => false, 'message' => 'Informe usuário e senha.'], 422);
}

if (strlen($senha) > VST_PASSWORD_MAX_LENGTH) {
    jsonResponse(['ok' => false, 'message' => 'A senha informada é muito longa.'], 422);
}

if ($action === 'register') {
    $userLength = function_exists('mb_strlen')
        ? mb_strlen($usuario)
        : strlen($usuario);

    if ($userLength < 3) {
        jsonResponse(
            ['ok' => false, 'message' => 'O usuário deve ter pelo menos 3 caracteres.'],
            422
        );
    }

    if (strlen($senha) < VST_PASSWORD_MIN_LENGTH) {
        jsonResponse(
            ['ok' => false, 'message' => 'A senha deve ter pelo menos 8 caracteres.'],
            422
        );
    }

    $check = $pdo->prepare(
        'SELECT id_usuario FROM usuarios WHERE LOWER(nome) = LOWER(?) LIMIT 1'
    );
    $check->execute([$usuario]);

    if ($check->fetch()) {
        jsonResponse(
            ['ok' => false, 'message' => 'Esse nome de usuário já está sendo utilizado.'],
            409
        );
    }

    $hash = password_hash($senha, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)'
    );
    $stmt->execute([$usuario, $hash]);

    jsonResponse(['ok' => true, 'message' => 'Conta criada com sucesso.'], 201);
}

if ($action === 'login') {
    enforceLoginRateLimit();

    $stmt = $pdo->prepare(
        'SELECT id_usuario, nome, senha_hash FROM usuarios WHERE LOWER(nome) = LOWER(?) LIMIT 1'
    );
    $stmt->execute([$usuario]);

    $user = $stmt->fetch();

    if (
        !$user
        || !password_verify($senha, (string)$user['senha_hash'])
    ) {
        registerLoginFailure();

        jsonResponse(
            ['ok' => false, 'message' => 'Usuário ou senha incorretos.'],
            401
        );
    }

    clearLoginFailures();

    if (password_needs_rehash((string)$user['senha_hash'], PASSWORD_DEFAULT)) {
        $rehash = $pdo->prepare(
            'UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?'
        );

        $rehash->execute([
            password_hash($senha, PASSWORD_DEFAULT),
            (int)$user['id_usuario'],
        ]);
    }

    establishAuthenticatedSession(
        (int)$user['id_usuario'],
        (string)$user['nome']
    );

    jsonResponse([
        'ok' => true,
        'message' => 'Login realizado com sucesso.',
        'user' => [
            'id' => (int)$user['id_usuario'],
            'name' => (string)$user['nome'],
        ],
    ]);
}

jsonResponse(['ok' => false, 'message' => 'Ação inválida.'], 404);
