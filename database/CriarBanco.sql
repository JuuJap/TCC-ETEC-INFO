-- =========================================================
-- VELAS S. TOMÉ
-- Estrutura limpa do banco de dados do projeto
-- MySQL 8+ / MariaDB 10.4+
-- Não insere usuários, clientes, produtos, vendas, pedidos ou outros registros iniciais.
-- Os INSERTs existentes dentro de triggers são regras do sistema e só executam após o uso da aplicação.
-- =========================================================

CREATE DATABASE IF NOT EXISTS velas_s_tome
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE velas_s_tome;

-- ATENÇÃO: este bloco recria as estruturas do projeto.
-- Se já houver dados reais nessas tabelas, faça backup antes de importar.
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS vw_controle_geral_resumo;
DROP VIEW IF EXISTS vw_dashboard_resumo;

DROP TABLE IF EXISTS controle_geral;
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS atividades;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS configuracoes_empresa;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 1. USUÁRIOS
-- Login simples por nome + senha.
-- A senha deve ser criada/validada pelo PHP com
-- password_hash() e password_verify().
-- =========================================================

CREATE TABLE usuarios (
    id_usuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuarios_nome (nome)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 2. CLIENTES
-- Compatível com clientes.html / clientes.js:
-- name, email, phone, address, city, status, createdAt.
-- O front usa literalmente active / inactive.
-- =========================================================

CREATE TABLE clientes (
    id_cliente INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) DEFAULT NULL,
    telefone VARCHAR(20) DEFAULT NULL,
    endereco VARCHAR(180) DEFAULT NULL,
    cidade VARCHAR(80) DEFAULT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_cliente),
    KEY idx_clientes_nome (nome),
    KEY idx_clientes_cidade (cidade),
    KEY idx_clientes_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 3. PRODUTOS
-- Compatível com produtos.html / produtos.js:
-- name, type, color, unitValue, unitWeight, characteristic.
-- O valor unitário é opcional.
-- O peso unitário é obrigatório e armazenado em gramas.
-- =========================================================

CREATE TABLE produtos (
    id_produto INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(80) DEFAULT NULL,
    cor VARCHAR(60) DEFAULT NULL,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    peso_unitario DECIMAL(12,3) NOT NULL,
    caracteristica VARCHAR(150) DEFAULT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_produto),
    KEY idx_produtos_nome (nome),
    KEY idx_produtos_tipo (tipo),

    CONSTRAINT chk_produtos_valor
        CHECK (valor_unitario >= 0),

    CONSTRAINT chk_produtos_peso
        CHECK (peso_unitario > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 4. VENDAS
-- Vendas e pedidos são operações diferentes no sistema.
-- A página de vendas registra descrição + valor + data/hora.
-- =========================================================

CREATE TABLE vendas (
    id_venda INT UNSIGNED NOT NULL AUTO_INCREMENT,
    descricao VARCHAR(120) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_venda),
    KEY idx_vendas_data (criado_em),
    KEY idx_vendas_descricao (descricao),

    CONSTRAINT chk_vendas_valor
        CHECK (valor > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 5. PEDIDOS
-- id_pedido = identificador interno do banco.
-- numero_pedido = número exibido no front (#0001, #0002...).
-- id_cliente é opcional porque o front permite digitar
-- um cliente que ainda não esteja cadastrado.
-- cliente_nome preserva o histórico mesmo se o cliente
-- for excluído posteriormente.
-- =========================================================

CREATE TABLE pedidos (
    id_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
    numero_pedido INT UNSIGNED NOT NULL,
    id_cliente INT UNSIGNED DEFAULT NULL,
    cliente_nome VARCHAR(120) NOT NULL,
    endereco_entrega VARCHAR(180) NOT NULL,
    data_pedido DATE NOT NULL,
    valor_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    peso_total DECIMAL(14,3) NOT NULL DEFAULT 0.000,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_pedido),
    UNIQUE KEY uq_pedidos_numero (numero_pedido),
    KEY idx_pedidos_cliente (id_cliente),
    KEY idx_pedidos_data (data_pedido),
    KEY idx_pedidos_cliente_nome (cliente_nome),

    CONSTRAINT fk_pedidos_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_pedidos_numero
        CHECK (numero_pedido > 0),

    CONSTRAINT chk_pedidos_totais
        CHECK (valor_total >= 0 AND peso_total >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 6. ITENS DO PEDIDO
-- Um pedido pode possuir vários itens.
-- id_produto é opcional porque o front também permite
-- descrição digitada manualmente.
-- Valor/peso são copiados para preservar o histórico.
-- totalValue e totalWeight do JS são calculados e não
-- precisam ser duplicados como colunas.
-- =========================================================

CREATE TABLE itens_pedido (
    id_item_pedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_pedido INT UNSIGNED NOT NULL,
    id_produto INT UNSIGNED DEFAULT NULL,
    descricao VARCHAR(140) NOT NULL,
    quantidade INT UNSIGNED NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL,
    peso_unitario DECIMAL(12,3) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_item_pedido),
    KEY idx_itens_pedido_pedido (id_pedido),
    KEY idx_itens_pedido_produto (id_produto),

    CONSTRAINT fk_itens_pedido_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos (id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_itens_pedido_produto
        FOREIGN KEY (id_produto)
        REFERENCES produtos (id_produto)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_itens_pedido_quantidade
        CHECK (quantidade > 0),

    CONSTRAINT chk_itens_pedido_valor
        CHECK (valor_unitario > 0),

    CONSTRAINT chk_itens_pedido_peso
        CHECK (peso_unitario > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 7. CONTROLE GERAL
-- Substitui o sessionStorage velasFinanceiroTemporario.
-- Uma movimentação pode movimentar dinheiro, peso ou ambos.
-- Pedido: entrada financeira + saída de peso.
-- Venda: entrada financeira; peso fica 0.
-- Manual: combinação escolhida pelo gerente.
-- =========================================================

CREATE TABLE controle_geral (
    id_movimentacao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    descricao VARCHAR(180) NOT NULL,

    tipo_valor ENUM('entrada', 'saida') NOT NULL DEFAULT 'entrada',
    valor DECIMAL(14,2) NOT NULL DEFAULT 0.00,

    tipo_peso ENUM('entrada', 'saida') NOT NULL DEFAULT 'entrada',
    peso DECIMAL(14,3) NOT NULL DEFAULT 0.000,

    origem ENUM('manual', 'venda', 'pedido') NOT NULL DEFAULT 'manual',
    id_venda INT UNSIGNED DEFAULT NULL,
    id_pedido INT UNSIGNED DEFAULT NULL,

    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_movimentacao),
    UNIQUE KEY uq_controle_venda (id_venda),
    UNIQUE KEY uq_controle_pedido (id_pedido),
    KEY idx_controle_data (criado_em),
    KEY idx_controle_origem (origem),
    KEY idx_controle_tipo_valor (tipo_valor),
    KEY idx_controle_tipo_peso (tipo_peso),
    KEY idx_controle_descricao (descricao),

    CONSTRAINT fk_controle_venda
        FOREIGN KEY (id_venda)
        REFERENCES vendas (id_venda)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_controle_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos (id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_controle_valor_peso
        CHECK (
            valor >= 0
            AND peso >= 0
            AND (valor > 0 OR peso > 0)
        ),

    CONSTRAINT chk_controle_origem
        CHECK (
            (origem = 'manual' AND id_venda IS NULL AND id_pedido IS NULL)
            OR
            (origem = 'venda' AND id_venda IS NOT NULL AND id_pedido IS NULL)
            OR
            (origem = 'pedido' AND id_venda IS NULL AND id_pedido IS NOT NULL)
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 8. ATIVIDADES RECENTES
-- Representa dashboardState.activities da Home.
-- O PHP deverá inserir uma atividade por ação do usuário.
-- Isso fica na aplicação (e não em triggers) para evitar
-- registros duplicados durante a atualização de pedidos.
-- =========================================================

CREATE TABLE atividades (
    id_atividade BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_usuario INT UNSIGNED DEFAULT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_atividade),
    KEY idx_atividades_usuario (id_usuario),
    KEY idx_atividades_categoria (categoria),
    KEY idx_atividades_data (criado_em),

    CONSTRAINT fk_atividades_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- 9. CONFIGURAÇÕES DA EMPRESA
-- Compatível com configuracoes.html:
-- nome (100), telefone (30), endereço (180), CNPJ (30).
-- A preferência de tema NÃO fica aqui; continua adequada
-- ao localStorage do navegador.
-- =========================================================

CREATE TABLE configuracoes_empresa (
    id_configuracao TINYINT UNSIGNED NOT NULL,
    nome_empresa VARCHAR(100) NOT NULL DEFAULT 'Velas S. Tomé',
    telefone VARCHAR(30) DEFAULT NULL,
    endereco VARCHAR(180) DEFAULT NULL,
    cnpj VARCHAR(30) DEFAULT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id_configuracao)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- TRIGGERS DOS ITENS DO PEDIDO
-- Recalculam automaticamente o valor_total e peso_total.
-- =========================================================

DELIMITER $$

CREATE TRIGGER trg_itens_pedido_ai
AFTER INSERT ON itens_pedido
FOR EACH ROW
BEGIN
    UPDATE pedidos
       SET valor_total = COALESCE((
               SELECT SUM(ip.quantidade * ip.valor_unitario)
                 FROM itens_pedido ip
                WHERE ip.id_pedido = NEW.id_pedido
           ), 0.00),
           peso_total = COALESCE((
               SELECT SUM(ip.quantidade * ip.peso_unitario)
                 FROM itens_pedido ip
                WHERE ip.id_pedido = NEW.id_pedido
           ), 0.000)
     WHERE id_pedido = NEW.id_pedido;
END$$

CREATE TRIGGER trg_itens_pedido_au
AFTER UPDATE ON itens_pedido
FOR EACH ROW
BEGIN
    UPDATE pedidos
       SET valor_total = COALESCE((
               SELECT SUM(ip.quantidade * ip.valor_unitario)
                 FROM itens_pedido ip
                WHERE ip.id_pedido = NEW.id_pedido
           ), 0.00),
           peso_total = COALESCE((
               SELECT SUM(ip.quantidade * ip.peso_unitario)
                 FROM itens_pedido ip
                WHERE ip.id_pedido = NEW.id_pedido
           ), 0.000)
     WHERE id_pedido = NEW.id_pedido;

    IF OLD.id_pedido <> NEW.id_pedido THEN
        UPDATE pedidos
           SET valor_total = COALESCE((
                   SELECT SUM(ip.quantidade * ip.valor_unitario)
                     FROM itens_pedido ip
                    WHERE ip.id_pedido = OLD.id_pedido
               ), 0.00),
               peso_total = COALESCE((
                   SELECT SUM(ip.quantidade * ip.peso_unitario)
                     FROM itens_pedido ip
                    WHERE ip.id_pedido = OLD.id_pedido
               ), 0.000)
         WHERE id_pedido = OLD.id_pedido;
    END IF;
END$$

CREATE TRIGGER trg_itens_pedido_ad
AFTER DELETE ON itens_pedido
FOR EACH ROW
BEGIN
    UPDATE pedidos
       SET valor_total = COALESCE((
               SELECT SUM(ip.quantidade * ip.valor_unitario)
                 FROM itens_pedido ip
                WHERE ip.id_pedido = OLD.id_pedido
           ), 0.00),
           peso_total = COALESCE((
               SELECT SUM(ip.quantidade * ip.peso_unitario)
                 FROM itens_pedido ip
                WHERE ip.id_pedido = OLD.id_pedido
           ), 0.000)
     WHERE id_pedido = OLD.id_pedido;
END$$

-- =========================================================
-- TRIGGERS DE VENDAS
-- Toda venda entra automaticamente no Controle Geral.
-- No front atual, venda não movimenta peso.
-- =========================================================

CREATE TRIGGER trg_vendas_ai
AFTER INSERT ON vendas
FOR EACH ROW
BEGIN
    INSERT INTO controle_geral (
        descricao,
        tipo_valor,
        valor,
        tipo_peso,
        peso,
        origem,
        id_venda,
        id_pedido,
        criado_em
    ) VALUES (
        NEW.descricao,
        'entrada',
        NEW.valor,
        'entrada',
        0.000,
        'venda',
        NEW.id_venda,
        NULL,
        NEW.criado_em
    );
END$$

CREATE TRIGGER trg_vendas_au
AFTER UPDATE ON vendas
FOR EACH ROW
BEGIN
    UPDATE controle_geral
       SET descricao = NEW.descricao,
           tipo_valor = 'entrada',
           valor = NEW.valor,
           tipo_peso = 'entrada',
           peso = 0.000,
           origem = 'venda',
           id_pedido = NULL
     WHERE id_venda = NEW.id_venda;
END$$

-- =========================================================
-- TRIGGER DE PEDIDOS
-- Quando os itens alteram os totais do pedido, o movimento
-- correspondente é criado/atualizado no Controle Geral:
-- entrada de valor + saída de peso.
-- =========================================================

CREATE TRIGGER trg_pedidos_au
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF NEW.valor_total > 0 OR NEW.peso_total > 0 THEN

        IF EXISTS (
            SELECT 1
              FROM controle_geral
             WHERE id_pedido = NEW.id_pedido
        ) THEN

            UPDATE controle_geral
               SET descricao = CONCAT(
                       'Pedido #',
                       LPAD(NEW.numero_pedido, 4, '0'),
                       ' - ',
                       NEW.cliente_nome
                   ),
                   tipo_valor = 'entrada',
                   valor = NEW.valor_total,
                   tipo_peso = 'saida',
                   peso = NEW.peso_total,
                   origem = 'pedido',
                   id_venda = NULL
             WHERE id_pedido = NEW.id_pedido;

        ELSE

            INSERT INTO controle_geral (
                descricao,
                tipo_valor,
                valor,
                tipo_peso,
                peso,
                origem,
                id_venda,
                id_pedido,
                criado_em
            ) VALUES (
                CONCAT(
                    'Pedido #',
                    LPAD(NEW.numero_pedido, 4, '0'),
                    ' - ',
                    NEW.cliente_nome
                ),
                'entrada',
                NEW.valor_total,
                'saida',
                NEW.peso_total,
                'pedido',
                NULL,
                NEW.id_pedido,
                NEW.criado_em
            );

        END IF;

    ELSE

        DELETE FROM controle_geral
         WHERE id_pedido = NEW.id_pedido;

    END IF;
END$$

DELIMITER ;

-- =========================================================
-- VIEWS DE RESUMO
-- Fornecem resumos da Home e do Controle Geral a partir dos
-- dados reais armazenados no banco.
-- =========================================================

CREATE VIEW vw_dashboard_resumo AS
SELECT
    (SELECT COUNT(*) FROM clientes) AS clientes_cadastrados,

    (SELECT COUNT(*)
       FROM clientes
      WHERE status = 'active') AS clientes_ativos,

    (SELECT COUNT(*) FROM produtos) AS produtos_cadastrados,

    (SELECT COUNT(*) FROM vendas) AS vendas_realizadas,

    (SELECT COALESCE(SUM(valor), 0.00)
       FROM vendas) AS faturamento_vendas,

    (SELECT COUNT(*) FROM pedidos) AS pedidos_registrados;

CREATE VIEW vw_controle_geral_resumo AS
SELECT
    COALESCE(SUM(
        CASE
            WHEN tipo_valor = 'entrada' THEN valor
            ELSE 0
        END
    ), 0.00) AS total_entradas,

    COALESCE(SUM(
        CASE
            WHEN tipo_valor = 'saida' THEN valor
            ELSE 0
        END
    ), 0.00) AS total_saidas,

    COALESCE(SUM(
        CASE
            WHEN tipo_valor = 'entrada' THEN valor
            ELSE -valor
        END
    ), 0.00) AS saldo_financeiro,

    COALESCE(SUM(
        CASE
            WHEN tipo_peso = 'entrada' THEN peso
            ELSE 0
        END
    ), 0.000) AS total_peso_entrada,

    COALESCE(SUM(
        CASE
            WHEN tipo_peso = 'saida' THEN peso
            ELSE 0
        END
    ), 0.000) AS total_peso_saida,

    COALESCE(SUM(
        CASE
            WHEN tipo_peso = 'entrada' THEN peso
            ELSE -peso
        END
    ), 0.000) AS saldo_peso
FROM controle_geral;

-- =========================================================
-- COMPATIBILIDADE COM O FRONT-END ATUAL
-- Os IDs abaixo preservam os identificadores gerados pelo
-- JavaScript ao sincronizar sessionStorage com MySQL.
-- O backend PHP modular não depende dessas colunas, então
-- ambos os backends podem coexistir sem conflito.
-- =========================================================

ALTER TABLE clientes
    ADD COLUMN front_id VARCHAR(80) NULL AFTER id_cliente,
    ADD UNIQUE KEY uq_clientes_front_id (front_id);

ALTER TABLE produtos
    ADD COLUMN front_id VARCHAR(80) NULL AFTER id_produto,
    ADD UNIQUE KEY uq_produtos_front_id (front_id);

ALTER TABLE vendas
    ADD COLUMN front_id VARCHAR(80) NULL AFTER id_venda,
    ADD UNIQUE KEY uq_vendas_front_id (front_id);

ALTER TABLE pedidos
    ADD COLUMN front_id VARCHAR(80) NULL AFTER id_pedido,
    ADD UNIQUE KEY uq_pedidos_front_id (front_id);

ALTER TABLE itens_pedido
    ADD COLUMN front_id VARCHAR(80) NULL AFTER id_item_pedido,
    ADD UNIQUE KEY uq_itens_pedido_front_id (front_id);

ALTER TABLE controle_geral
    ADD COLUMN front_id VARCHAR(80) NULL AFTER id_movimentacao,
    ADD UNIQUE KEY uq_controle_front_id (front_id);
