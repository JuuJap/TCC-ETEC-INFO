# Velas São Tomé

Sistema web demonstrativo desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC).

O projeto apresenta uma plataforma de gerenciamento para pequenas empresas, com módulos de clientes, produtos, vendas, pedidos, Controle Geral de valores, pesos e atividades administrativas.

A versão atual funciona totalmente no navegador, utilizando armazenamento temporário e sem conexão com banco de dados ou back-end.

## Funcionalidades atuais

- Login e cadastro temporário de usuários
- Conta de demonstração
- Tema claro e escuro
- Página de configurações com aparência, dados da empresa, resumo do sistema e informações do projeto
- Menu lateral responsivo
- Painel administrativo
- Cadastro, edição, exclusão, busca e filtros de clientes
- Cadastro, edição, exclusão, busca e filtros de produtos
- Registro e histórico de vendas
- Controle Geral com entradas, saídas e saldo financeiro, além de entradas, saídas e saldo de peso
- Integração automática das vendas com o Controle Geral
- Montagem completa de pedidos
- Preenchimento automático de endereço ao selecionar um cliente
- Preenchimento automático de valor e peso ao selecionar um produto
- Vários itens por pedido
- Cálculo automático de valores e pesos
- Histórico, visualização, edição e exclusão de pedidos
- Integração dos pedidos com o Controle Geral: entrada financeira e saída de peso
- Download de pedidos em `.txt`
- Impressão de pedidos e possibilidade de salvar em PDF
- Histórico de atividades na Home
- Interface responsiva para computadores, tablets e celulares

## Conta de demonstração

```text
Usuário: Teste
Senha: 1234
```

> Não utilize senhas reais. Esta versão é apenas demonstrativa.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- sessionStorage
- localStorage


## Organização do código

A versão atual foi refatorada para reduzir duplicações sem alterar o funcionamento ou o visual da aplicação.

O arquivo `js/common.js` concentra menu lateral, barra superior, tema, usuário, logout, notificações, formatação de dados e funções utilitárias compartilhadas. Cada módulo continua com seu próprio JavaScript apenas para a lógica específica da página.

## Estrutura

```text
Velas-S-Tome/
├── index.html
├── cadastro.html
├── home.html
├── clientes.html
├── produtos.html
├── vendas.html
├── pedidos.html
├── financeiro.html
├── configuracoes.html
├── README.md
├── css/
│   ├── main.css
│   ├── home.css
│   ├── clientes.css
│   ├── produtos.css
│   ├── vendas.css
│   ├── pedidos.css
│   ├── financeiro.css
│   └── configuracoes.css
├── js/
│   ├── common.js
│   ├── script.js
│   ├── home.js
│   ├── clientes.js
│   ├── produtos.js
│   ├── vendas.js
│   ├── pedidos.js
│   ├── financeiro.js
│   └── configuracoes.js
└── img/
    ├── Logo1.png
    └── wall.png
```

## Armazenamento

O `sessionStorage` mantém temporariamente usuários, clientes, produtos, vendas, pedidos, dados do Controle Geral e atividades do painel durante a sessão.

O `localStorage` é utilizado para manter a preferência de tema claro ou escuro.

## Como executar

1. Abra a pasta no Visual Studio Code.
2. Instale a extensão Live Server.
3. Clique com o botão direito em `index.html`.
4. Selecione **Open with Live Server**.

Não é necessário PHP, XAMPP ou MySQL nesta versão.

## Status

Projeto em desenvolvimento — beta demonstrativa front-end.

## Autores

- [Julio Aparecido](https://github.com/JuuJap)
- [Julio Cesar](https://github.com/CesarNSR)
- [Matheus Bassi](https://github.com/Bassi1711)
