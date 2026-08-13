# Velas São Tomé

Sistema web demonstrativo desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC).

O projeto apresenta a proposta de uma plataforma de gerenciamento de dados para pequenas empresas, com foco na organização de clientes, produtos, vendas, pedidos e atividades administrativas.

Atualmente, o sistema está em versão beta e funciona somente no navegador, sem conexão com banco de dados real ou back-end.

## Sobre o projeto

A proposta do projeto é demonstrar como uma pequena empresa pode centralizar informações importantes em um único sistema de gerenciamento.

A aplicação possui tela de login, cadastro temporário de usuários, painel administrativo e módulos específicos para gerenciamento de clientes e produtos.

Como esta é uma versão demonstrativa, os dados cadastrados durante a utilização são armazenados temporariamente no navegador por meio do `sessionStorage`.

Isso significa que as informações são mantidas durante a sessão atual, mas são apagadas quando a aba do navegador é encerrada.

## Funcionalidades

Atualmente, o sistema possui:

- Tela de login responsiva
- Cadastro temporário de usuários
- Conta de demonstração
- Redirecionamento para o painel após o login
- Proteção básica das páginas administrativas
- Tema claro e escuro
- Preferência de tema mantida entre as páginas
- Menu lateral responsivo
- Painel administrativo
- Resumo de clientes, produtos, vendas e faturamento
- Histórico de atividades recentes
- Pesquisa de atividades
- Cadastro, edição e exclusão de clientes
- Pesquisa de clientes
- Filtro de clientes por status
- Cadastro, edição e exclusão de produtos
- Pesquisa de produtos
- Filtro de produtos por tipo
- Registro temporário de vendas
- Registro temporário de pedidos
- Sincronização dos cadastros com o painel principal
- Encerramento de sessão
- Interface adaptada para computadores, tablets e celulares

## Módulo de clientes

A página de clientes permite cadastrar e organizar informações relacionadas aos clientes da empresa.

Atualmente, cada cliente pode possuir:

- nome;
- e-mail;
- telefone;
- cidade;
- status.

Também é possível:

- cadastrar novos clientes;
- editar clientes existentes;
- excluir registros;
- pesquisar clientes;
- filtrar clientes entre ativos e inativos;
- visualizar estatísticas relacionadas aos cadastros.

Os dados são armazenados temporariamente no `sessionStorage`.

## Módulo de produtos

A página de produtos permite cadastrar e organizar os produtos da empresa.

Cada produto pode possuir:

- nome do produto;
- tipo;
- cor;
- característica.

Também é possível:

- cadastrar novos produtos;
- editar produtos existentes;
- excluir registros;
- pesquisar produtos;
- filtrar produtos por tipo;
- visualizar a quantidade de produtos cadastrados;
- visualizar a quantidade de tipos diferentes;
- visualizar a quantidade de cores diferentes.

Os dados também são armazenados temporariamente no `sessionStorage`.

## Painel administrativo

Após realizar o login, o usuário é direcionado para a página inicial do sistema.

O painel apresenta informações demonstrativas relacionadas a:

- clientes cadastrados;
- produtos cadastrados;
- vendas realizadas;
- faturamento;
- desempenho mensal;
- atividades recentes.

Também existem ações rápidas para:

- cadastrar um novo cliente;
- cadastrar um novo produto;
- registrar uma nova venda;
- registrar um novo pedido.

As ações de **Novo cliente** e **Novo produto** direcionam para seus respectivos módulos e abrem automaticamente o formulário de cadastro.

## Conta de demonstração

Para entrar no sistema sem criar uma nova conta, utilize:

```text
Usuário: Teste
Senha: 1234
```

Também é possível criar uma conta temporária pela página de cadastro.

> Não utilize senhas reais. Esta versão é apenas demonstrativa e não possui autenticação segura ou armazenamento de senhas em banco de dados.

## Tecnologias utilizadas

O projeto utiliza:

- HTML5
- CSS3
- JavaScript
- `sessionStorage`
- `localStorage`

Nesta versão, não são utilizados:

- PHP
- MySQL
- XAMPP
- frameworks de back-end
- banco de dados externo

## Estrutura do projeto

```text
Velas-S-Tome/
├── index.html
├── cadastro.html
├── home.html
├── clientes.html
├── produtos.html
│
├── css/
│   ├── main.css
│   ├── home.css
│   ├── clientes.css
│   └── produtos.css
│
├── js/
│   ├── script.js
│   ├── home.js
│   ├── clientes.js
│   └── produtos.js
│
└── img/
    ├── Logo1.png
    └── wall.png
```

## Como executar

1. Clone o repositório:

```bash
git clone URL-DO-REPOSITORIO
```

2. Abra a pasta do projeto no Visual Studio Code.

3. Instale a extensão **Live Server**, caso ainda não tenha.

4. Clique com o botão direito no arquivo `index.html`.

5. Selecione **Open with Live Server**.

6. A aplicação será aberta no navegador.

O projeto não precisa de XAMPP, PHP, MySQL ou qualquer servidor de banco de dados nesta versão.

## Armazenamento temporário

A aplicação utiliza recursos de armazenamento do próprio navegador.

### `sessionStorage`

O `sessionStorage` é utilizado para armazenar temporariamente:

- usuários criados durante a demonstração;
- usuário atualmente conectado;
- informações do painel;
- atividades recentes;
- clientes cadastrados;
- produtos cadastrados.

Essas informações permanecem disponíveis durante a sessão atual e são apagadas quando a aba é encerrada.

### `localStorage`

O `localStorage` é utilizado para armazenar a preferência de tema do usuário.

Dessa forma, ao escolher entre tema claro ou escuro, a preferência pode ser mantida ao navegar entre:

- página inicial;
- clientes;
- produtos.

## Navegação atual

As páginas disponíveis atualmente são:

```text
Login
  │
  ├── Cadastro
  │
  └── Painel
       │
       ├── Clientes
       │
       └── Produtos
```

No menu administrativo:

- **Início** direciona para o painel;
- **Clientes** direciona para o gerenciamento de clientes;
- **Produtos** direciona para o gerenciamento de produtos;
- **Vendas**, **Relatórios** e **Configurações** ainda representam módulos em desenvolvimento.

## Objetivo acadêmico

Este projeto foi criado para demonstrar conhecimentos relacionados a:

- desenvolvimento front-end;
- organização de sistemas web;
- desenvolvimento de interfaces;
- experiência do usuário;
- manipulação do DOM com JavaScript;
- armazenamento de dados no navegador;
- operações de cadastro, edição e exclusão;
- organização de dados empresariais;
- planejamento de funcionalidades;
- estruturação de um futuro sistema com banco de dados.

Embora a versão atual ainda não possua um banco de dados real, a estrutura da aplicação foi planejada para permitir uma futura integração com um back-end e um sistema de persistência de dados.

## Possível estrutura futura de dados

Em uma versão com banco de dados, o sistema poderá possuir entidades como:

- usuários;
- clientes;
- produtos;
- vendas;
- pedidos;
- atividades.

Os dados que atualmente são armazenados no navegador poderão futuramente ser registrados de forma permanente em um banco de dados.

## Próximas etapas

Entre as melhorias planejadas estão:

- conexão com banco de dados;
- desenvolvimento de um back-end;
- autenticação real de usuários;
- criptografia segura de senhas;
- página completa de vendas;
- gerenciamento completo de pedidos;
- página de relatórios;
- página de configurações;
- filtros por período;
- gráficos baseados em dados reais;
- diferentes níveis de acesso;
- persistência permanente dos cadastros;
- validações mais avançadas;
- melhoria da integração entre os módulos.

## Status

**Projeto em desenvolvimento.**

Versão atual: **Beta demonstrativa Front-end**.

O sistema atualmente possui os módulos de **Clientes** e **Produtos** funcionais, enquanto outros módulos administrativos continuam em desenvolvimento.

---

## Autores

- [Julio Aparecido](https://github.com/JuuJap)
- [Julio Cesar](https://github.com/CesarNSR)
- [Matheus Bassi](https://github.com/Bassi1711)

---
