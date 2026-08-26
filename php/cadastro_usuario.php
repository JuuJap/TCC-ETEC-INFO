<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

requireMethod('POST');

try {
    $pdo = conectarBanco();
    $data = jsonInput();

    $usuario = cleanString($data['usuario'] ?? '', 100);
    $senha = (string) ($data['senha'] ?? '');
    $confirmarSenha = (string) ($data['confirmar_senha'] ?? $senha);

    if ($usuario === '' || $senha === '' || $confirmarSenha === '') {
        jsonResponse([
            'sucesso' => false,
            'mensagem' => 'Preencha usuário, senha e confirmação de senha.'
        ], 422);
    }

    if (mb_strlen($usuario) < 3) {
        jsonResponse([
            'sucesso' => false,
            'mensagem' => 'O usuário deve ter pelo menos 3 caracteres.'
        ], 422);
    }

    if (mb_strlen($senha) < 4) {
        jsonResponse([
            'sucesso' => false,
            'mensagem' => 'A senha deve ter pelo menos 4 caracteres.'
        ], 422);
    }

    if ($senha !== $confirmarSenha) {
        jsonResponse([
            'sucesso' => false,
            'mensagem' => 'As senhas não são iguais.'
        ], 422);
    }

    $check = $pdo->prepare('SELECT id_usuario FROM usuarios WHERE LOWER(nome) = LOWER(?) LIMIT 1');
    $check->execute([$usuario]);

    if ($check->fetchColumn() !== false) {
        jsonResponse([
            'sucesso' => false,
            'mensagem' => 'Esse nome de usuário já está sendo utilizado.'
        ], 409);
    }

    $stmt = $pdo->prepare('INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)');
    $stmt->execute([
        $usuario,
        password_hash($senha, PASSWORD_DEFAULT)
    ]);

    jsonResponse([
        'sucesso' => true,
        'mensagem' => 'Conta criada com sucesso.',
        'usuario' => [
            'id' => (int) $pdo->lastInsertId(),
            'nome' => $usuario,
        ]
    ], 201);
} catch (Throwable $e) {
    handleApiException($e);
}
