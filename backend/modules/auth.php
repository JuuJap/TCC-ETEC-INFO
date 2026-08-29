<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const VST_MOD_PASSWORD_MIN_LENGTH = 8;
const VST_MOD_PASSWORD_MAX_LENGTH = 255;

$metodo = metodoPermitido('GET', 'POST');
$acao = strtolower(texto($_GET['acao'] ?? $_GET['action'] ?? '', 30));

try {
    $pdo = conectarBanco();

    if ($metodo === 'GET' || $acao === 'me' || $acao === 'session') {
        $usuario = usuarioAtual();

        responder([
            'sucesso' => true,
            'autenticado' => $usuario !== null,
            'usuario' => $usuario,
        ]);
    }

    $dados = entrada();

    if ($acao === 'logout' || $acao === 'sair') {
        limparSessao();

        responder([
            'sucesso' => true,
            'mensagem' => 'Sessão encerrada.'
        ]);
    }

    $nome = texto(
        $dados['nome']
        ?? $dados['name']
        ?? $dados['username']
        ?? '',
        100
    );

    $senha = (string)(
        $dados['senha']
        ?? $dados['password']
        ?? ''
    );

    if ($nome === '' || $senha === '') {
        responder(
            ['sucesso' => false, 'mensagem' => 'Informe usuário e senha.'],
            422
        );
    }

    if (strlen($senha) > VST_MOD_PASSWORD_MAX_LENGTH) {
        responder(
            ['sucesso' => false, 'mensagem' => 'A senha informada é muito longa.'],
            422
        );
    }

    if ($acao === 'register' || $acao === 'cadastro' || $acao === 'cadastrar') {
        $tamanhoNome = function_exists('mb_strlen')
            ? mb_strlen($nome)
            : strlen($nome);

        if ($tamanhoNome < 3) {
            responder(
                ['sucesso' => false, 'mensagem' => 'O usuário deve ter pelo menos 3 caracteres.'],
                422
            );
        }

        if (strlen($senha) < VST_MOD_PASSWORD_MIN_LENGTH) {
            responder(
                ['sucesso' => false, 'mensagem' => 'A senha deve possuir pelo menos 8 caracteres.'],
                422
            );
        }

        $existe = $pdo->prepare(
            'SELECT id_usuario FROM usuarios WHERE LOWER(nome) = LOWER(:nome) LIMIT 1'
        );
        $existe->execute([':nome' => $nome]);

        if ($existe->fetchColumn() !== false) {
            responder(
                ['sucesso' => false, 'mensagem' => 'Este nome de usuário já está cadastrado.'],
                409
            );
        }

        $hash = password_hash($senha, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare(
            'INSERT INTO usuarios (nome, senha_hash) VALUES (:nome, :hash)'
        );
        $stmt->execute([
            ':nome' => $nome,
            ':hash' => $hash
        ]);

        $id = (int)$pdo->lastInsertId();

        autenticarSessao(
            $id,
            $nome
        );

        responder(
            [
                'sucesso' => true,
                'mensagem' => 'Conta criada com sucesso.',
                'usuario' => [
                    'id' => $id,
                    'nome' => $nome
                ],
            ],
            201
        );
    }

    if ($acao === 'login' || $acao === 'entrar' || $acao === '') {
        limitarTentativasLogin();

        $stmt = $pdo->prepare(
            'SELECT id_usuario, nome, senha_hash FROM usuarios WHERE LOWER(nome) = LOWER(:nome) LIMIT 1'
        );
        $stmt->execute([':nome' => $nome]);

        $usuario = $stmt->fetch();

        if (
            !$usuario
            || !password_verify(
                $senha,
                (string)$usuario['senha_hash']
            )
        ) {
            registrarFalhaLogin();

            responder(
                ['sucesso' => false, 'mensagem' => 'Usuário ou senha incorretos.'],
                401
            );
        }

        limparFalhasLogin();

        if (
            password_needs_rehash(
                (string)$usuario['senha_hash'],
                PASSWORD_DEFAULT
            )
        ) {
            $rehash = $pdo->prepare(
                'UPDATE usuarios SET senha_hash = :hash WHERE id_usuario = :id'
            );

            $rehash->execute([
                ':hash' => password_hash($senha, PASSWORD_DEFAULT),
                ':id' => (int)$usuario['id_usuario'],
            ]);
        }

        autenticarSessao(
            (int)$usuario['id_usuario'],
            (string)$usuario['nome']
        );

        responder([
            'sucesso' => true,
            'mensagem' => 'Login realizado com sucesso.',
            'usuario' => [
                'id' => (int)$usuario['id_usuario'],
                'nome' => (string)$usuario['nome'],
            ],
        ]);
    }

    responder(
        ['sucesso' => false, 'mensagem' => 'Ação de autenticação inválida.'],
        400
    );

} catch (Throwable $erro) {
    erroApi($erro);
}
