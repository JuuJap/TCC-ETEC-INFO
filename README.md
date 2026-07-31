# Velas S. Tomé

Sistema web demonstrativo desenvolvido como parte de um Trabalho de Conclusão de Curso (TCC).

O projeto apresenta a proposta de uma plataforma de gerenciamento de dados para pequenas empresas, com foco em organização de clientes, produtos, estoque, vendas, fornecedores e atividades administrativas.

Atualmente, o sistema está em versão beta e funciona somente no navegador, sem conexão com banco de dados real.

## Sobre o projeto

A proposta do projeto é demonstrar como uma pequena empresa pode centralizar informações importantes em um único sistema.

A aplicação possui uma tela de login, cadastro temporário de usuários e um painel administrativo com informações simuladas.

Os dados criados durante os testes são armazenados no `sessionStorage` do navegador. Isso significa que eles são temporários e são apagados quando a aba é fechada.

## Funcionalidades

- Tela de login responsiva
- Cadastro temporário de usuários
- Conta de demonstração
- Redirecionamento para o painel após o login
- Proteção básica da página inicial
- Tema claro e escuro
- Menu lateral responsivo
- Resumo de clientes, produtos, vendas e faturamento
- Cadastro temporário de clientes
- Cadastro temporário de produtos
- Registro temporário de vendas
- Cadastro temporário de fornecedores
- Histórico de atividades recentes
- Pesquisa de atividades e produtos
- Avisos de estoque baixo
- Encerramento de sessão
- Interface adaptada para computadores, tablets e celulares

## Conta de demonstração

Para entrar sem criar uma nova conta, utilize:

```text
Usuário: Teste
Senha: 1234
```

Também é possível criar uma conta temporária pela página de cadastro.

> Não utilize senhas reais. Esta versão é apenas demonstrativa e não possui autenticação segura.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- `sessionStorage`
- `localStorage`

## Estrutura do projeto

```text
Velas-S-Tome/
├── index.html
├── cadastro.html
├── home.html
│
├── css/
│   ├── main.css
│   └── home.css
│
├── js/
│   ├── script.js
│   └── home.js
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

6. Acesse a aplicação pelo endereço exibido no navegador.

O projeto não precisa de XAMPP, PHP, MySQL ou qualquer outro servidor de banco de dados nesta versão.

## Armazenamento temporário

A aplicação utiliza dois recursos do navegador:

### `sessionStorage`

Utilizado para armazenar:

- perfis temporários;
- usuário conectado;
- dados demonstrativos do painel;
- atividades recentes.

Essas informações são apagadas quando a aba é fechada.

### `localStorage`

Utilizado para manter a preferência de tema claro ou escuro.

## Objetivo acadêmico

Este projeto foi criado para demonstrar conceitos relacionados a:

- desenvolvimento front-end;
- organização de sistemas;
- modelagem de funcionalidades;
- experiência do usuário;
- gerenciamento de dados;
- estruturação de um futuro banco de dados empresarial.

Embora a versão atual não possua banco de dados real, a interface foi planejada para representar módulos que futuramente podem ser conectados a tabelas como:

- clientes;
- produtos;
- estoque;
- vendas;
- fornecedores;
- usuários;
- atividades.

## Próximas etapas

Entre as melhorias planejadas estão:

- conexão com banco de dados;
- autenticação real de usuários;
- criptografia de senhas;
- páginas completas para clientes e produtos;
- controle de entrada e saída de estoque;
- geração de relatórios;
- filtros por período;
- gráficos de vendas;
- diferentes níveis de acesso;
- edição e exclusão de registros;
- integração com um back-end.

## Status

Projeto em desenvolvimento.

Versão atual: beta demonstrativa.

## Autor

Desenvolvido por Julio como projeto de TCC.
