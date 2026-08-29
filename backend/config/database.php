<?php
declare(strict_types=1);

/**
 * Conexão com o banco criado por database/CriarBanco.sql.
 * XAMPP padrão: host 127.0.0.1, usuário root e senha vazia.
 * Altere apenas se seu MySQL usar outras credenciais.
 */
function conectarBanco(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = '127.0.0.1';
    $porta = '3306';
    $banco = 'velas_s_tome';
    $usuario = 'root';
    $senha = '';

    $dsn = "mysql:host={$host};port={$porta};dbname={$banco};charset=utf8mb4";

    $pdo = new PDO($dsn, $usuario, $senha, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
