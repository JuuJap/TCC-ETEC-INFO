# Velas S. Tomé — Sistema de Gerenciamento

Sistema web full-stack desenvolvido como Trabalho de Conclusão de Curso (TCC) para apoiar o gerenciamento interno da **Velas S. Tomé**.

A aplicação reúne autenticação, clientes, produtos, vendas, pedidos, Controle Geral, dashboard e configurações da empresa em uma única interface responsiva. A versão atual foi pensada principalmente para **uso local em uma única máquina com XAMPP**, utilizando PHP e MySQL.

---

## Visão geral

O projeto utiliza:

- **HTML5** para a estrutura das páginas;
- **CSS3** para identidade visual, responsividade e temas;
- **JavaScript** para interação, validações e lógica do front-end;
- **PHP 8+** para autenticação, sincronização e regras do servidor;
- **MySQL/MariaDB** para persistência;
- **PDO** com prepared statements para acesso ao banco;
- **sessionStorage/localStorage** como camada de estado do navegador integrada ao MySQL;
- **Web Components** para elementos compartilhados do painel.

Fluxo principal:

```text
Navegador
   │
   ├── HTML / CSS / JavaScript
   │
   ▼
backend-sync.js / APIs PHP
   │
   ▼
MySQL
```

A versão atual não depende de Live Server. O projeto deve ser executado pelo Apache/PHP do XAMPP.

---

## Estado atual

O sistema possui front-end, PHP e MySQL integrados e utiliza dados reais do banco.

O arquivo SQL de instalação cria apenas a **estrutura vazia** do sistema. Ele não cria usuário de teste e não insere clientes, produtos, vendas, pedidos ou outras informações iniciais.

Na primeira utilização:

1. importe o banco;
2. abra o sistema;
3. clique em **Criar conta**;
4. cadastre o primeiro usuário;
5. faça login normalmente.

---

## Requisitos

Para executar localmente:

- Windows, Linux ou macOS;
- XAMPP ou ambiente equivalente com:
  - Apache;
  - PHP 8 ou superior;
  - MySQL/MariaDB;
  - extensão PDO MySQL habilitada;
- navegador moderno, preferencialmente Chrome, Edge ou Firefox.

---

# Instalação com XAMPP

## 1. Coloque o projeto no `htdocs`

Extraia/copiei a pasta do projeto para:

```text
C:\xampp\htdocs\tcc\
```

A raiz deve ficar semelhante a:

```text
tcc/
├── index.html
├── cadastro.html
├── README.md
├── pages/
├── assets/
├── backend/
├── database/
├── docs/
└── tools/
```

## 2. Inicie os serviços

Abra o XAMPP e inicie:

```text
Apache
MySQL
```

## 3. Importe o banco

Abra:

```text
http://localhost/phpmyadmin/
```

No phpMyAdmin:

1. abra a opção **Importar**;
2. selecione:

```text
database/CriarBanco.sql
```

3. execute a importação.

O próprio SQL cria:

```text
velas_s_tome
```

Não é necessário criar o banco manualmente antes.

> Atenção: o SQL recria as estruturas do sistema. Caso já existam dados importantes no banco `velas_s_tome`, faça backup antes de importar novamente.

## 4. Abra o site

Acesse:

```text
http://localhost/tcc/
```

Não utilize Live Server na versão integrada, porque login, sessão e persistência dependem do Apache/PHP.

## 5. Crie a primeira conta

O banco inicia sem usuários.

Na tela inicial, escolha:

```text
Criar conta
```

Regras atuais:

```text
Usuário: mínimo de 3 caracteres
Senha: mínimo de 8 caracteres
```

Depois do cadastro, volte ao login e acesse o sistema.

---

## URLs úteis

| Recurso | URL |
|---|---|
| Sistema | `http://localhost/tcc/` |
| Cadastro | `http://localhost/tcc/cadastro.html` |
| phpMyAdmin | `http://localhost/phpmyadmin/` |
| Diagnóstico | `http://localhost/tcc/backend/modules/diagnostico.php` |

---

# Funcionalidades

## Autenticação

O sistema possui autenticação real ligada ao MySQL.

Funcionalidades:

- cadastro de usuários;
- login por usuário e senha;
- senha armazenada com `password_hash()`;
- validação com `password_verify()`;
- sessão PHP;
- regeneração do identificador da sessão após login;
- alteração de senha em **Configurações > Conta e segurança**;
- opção **Lembrar usuário**, que armazena apenas o nome do usuário no navegador;
- verificação de sessão existente;
- redirecionamento automático para a Home quando o usuário já está autenticado;
- logout real no servidor;
- limite de tentativas consecutivas de login;
- expiração da sessão após longo período sem atividade.

Não existe recuperação de senha por e-mail porque a tabela de usuários não possui um e-mail ou outro canal de recuperação vinculado à autenticação.

---

## Home / Dashboard

A Home utiliza dados reais do sistema.

Exibe:

- quantidade de clientes;
- quantidade de produtos;
- quantidade de vendas;
- variação mensal;
- distribuição dos registros do mês;
- data atual;
- ações rápidas;
- atividades recentes.

Os percentuais dos cards não são valores fixos.

A variação é calculada utilizando os registros do mês atual em comparação ao mês anterior.

Quando não existem dados, os indicadores permanecem em:

```text
0%
```

O painel mensal utiliza os registros reais de:

- vendas;
- novos clientes;
- pedidos;
- produtos.

---

## Clientes

O módulo Clientes permite:

- cadastrar;
- editar;
- excluir;
- pesquisar;
- filtrar;
- acompanhar status.

Campos disponíveis:

```text
Nome
E-mail
Telefone
Endereço
Cidade
Status
```

Status:

```text
Ativo
Inativo
```

Ao selecionar um cliente cadastrado em Pedidos, endereço e cidade podem ser preenchidos automaticamente.

---

## Produtos

O módulo Produtos permite:

- cadastrar;
- editar;
- excluir;
- pesquisar;
- filtrar.

Campos:

```text
Nome
Tipo
Cor
Característica
Valor unitário
Peso unitário
```

Regras:

- o valor unitário do produto é opcional;
- o peso unitário é obrigatório;
- valor e peso aceitam casas decimais;
- dados cadastrados podem ser preenchidos automaticamente em Pedidos.

---

## Vendas

O módulo Vendas registra operações independentes dos Pedidos.

Informações principais:

```text
Cliente / descrição
Valor
Data e hora
```

Ao registrar uma venda, o banco cria automaticamente a movimentação correspondente no **Controle Geral** como entrada financeira.

Venda não movimenta peso automaticamente.

---

## Pedidos

O módulo Pedidos é responsável pela criação e manutenção dos pedidos da empresa.

Funcionalidades:

- numeração sequencial;
- cliente cadastrado ou digitado manualmente;
- preenchimento automático de endereço;
- seleção de produtos;
- preenchimento automático de valor e peso;
- vários itens no mesmo pedido;
- quantidade;
- valores decimais;
- pesos decimais;
- cálculo do total por item;
- cálculo do valor total do pedido;
- cálculo do peso total;
- edição de itens;
- remoção de itens;
- salvar;
- visualizar;
- editar;
- excluir;
- pesquisar no histórico;
- baixar em `.txt`;
- imprimir;
- salvar como PDF através do navegador.

Quando os dados da empresa estão configurados, o pedido pode utilizar:

- nome da empresa;
- telefone;
- endereço;
- CNPJ.

### Integração com Controle Geral

Um pedido representa:

```text
Entrada financeira
+
Saída de peso
```

Ao alterar o pedido, a movimentação vinculada é atualizada.

Ao excluir o pedido, a movimentação correspondente também é removida.

---

## Controle Geral

O módulo é exibido na interface como **Controle Geral**.

Alguns arquivos ainda utilizam o nome `financeiro` internamente por compatibilidade histórica.

Existem dois controles paralelos:

```text
FINANCEIRO
├── Entradas
├── Saídas
└── Saldo

PESO
├── Entradas
├── Saídas
└── Saldo
```

Uma movimentação manual pode conter:

- somente valor;
- somente peso;
- valor e peso.

O histórico também recebe movimentações automáticas de Vendas e Pedidos.

---

## Configurações

### Aparência

Temas disponíveis:

```text
Claro
Escuro
Automático
```

Quando ainda não existe preferência salva, o painel inicia em tema escuro.

### Dados da empresa

Campos:

```text
Nome
Telefone
Endereço
CNPJ
```

As informações ficam persistidas no MySQL.

O nome também pode aparecer na interface e os dados podem ser utilizados nos documentos de Pedido.

### Conta e segurança

Permite alterar a senha da conta conectada.

É necessário informar:

- senha atual;
- nova senha;
- confirmação da nova senha.

A nova senha deve possuir pelo menos 8 caracteres.

### Dados do sistema

Exibe as quantidades de:

- clientes;
- produtos;
- vendas;
- pedidos.

### Gerenciamento dos dados

#### Restaurar dados de exemplo

Substitui os registros operacionais atuais por um conjunto de dados criado para apresentação/testes.

Essa operação não acontece automaticamente na instalação.

#### Limpar dados do sistema

Remove:

- clientes;
- produtos;
- vendas;
- pedidos;
- itens de pedido;
- movimentações;
- atividades.

Preserva:

- contas de usuário;
- preferência de tema;
- dados da empresa.

A operação possui duas confirmações antes da exclusão.

---

# Diálogos e notificações

O sistema não utiliza caixas nativas do navegador como:

```javascript
alert()
confirm()
prompt()
```

Ações que precisam de confirmação utilizam modais internos do próprio sistema.

Notificações comuns utilizam toasts.

Isso mantém o comportamento visual consistente com o restante da aplicação.

---

# Banco de dados

Arquivo de instalação:

```text
database/CriarBanco.sql
```

Banco:

```text
velas_s_tome
```

## Tabelas

```text
usuarios
clientes
produtos
vendas
pedidos
itens_pedido
controle_geral
atividades
configuracoes_empresa
```

## Views

```text
vw_dashboard_resumo
vw_controle_geral_resumo
```

## Triggers

O banco utiliza triggers para:

- recalcular o valor total do Pedido;
- recalcular o peso total do Pedido;
- criar/atualizar a movimentação proveniente de Vendas;
- criar/atualizar a movimentação vinculada a Pedidos.

## Banco inicial vazio

O SQL não insere dados durante a instalação.

Depois da importação:

```text
Usuários:       0
Clientes:       0
Produtos:       0
Vendas:         0
Pedidos:        0
Movimentações:  0
Atividades:     0
```

Os `INSERT` que aparecem dentro de triggers representam regras executadas apenas após o uso do sistema.

---

# Sincronização front-end / MySQL

O front-end foi criado inicialmente utilizando armazenamento no navegador.

Posteriormente foi integrada a persistência MySQL sem reconstruir todas as páginas.

A ponte principal é:

```text
assets/js/backend-sync.js
```

Fluxo simplificado:

```text
Página abre
   ↓
backend-sync.js
   ↓
backend/api/sync.php
   ↓
MySQL
   ↓
estado do navegador
   ↓
JavaScript específico da página
```

O sincronizador:

1. carrega os dados do MySQL;
2. hidrata as estruturas utilizadas pelo front-end;
3. acompanha alterações nas chaves de armazenamento;
4. envia os dados atualizados para o PHP.

As colunas:

```text
front_id
```

mantêm a identidade dos registros entre navegador e banco.

Algumas chaves internas ainda possuem a palavra `Temporario` por compatibilidade histórica. Isso não significa que os registros sejam temporários: os dados atuais são persistidos no MySQL.

---

# Back-end

## API utilizada atualmente

O front principal utiliza:

```text
backend/api/
├── _bootstrap.php
├── auth.php
├── sync.php
└── maintenance.php
```

Responsabilidades:

- autenticação;
- sessão;
- alteração de senha;
- sincronização;
- manutenção/limpeza/restauração de dados.

## Endpoints modulares

Também existe:

```text
backend/modules/
```

com endpoints separados para:

- autenticação;
- clientes;
- produtos;
- vendas;
- pedidos;
- Controle Geral;
- dashboard;
- configurações;
- atividades;
- diagnóstico.

Esses endpoints foram desenvolvidos em outra etapa e permanecem disponíveis para uma futura migração para CRUD direto por API.

O fluxo atual do front utiliza principalmente `backend/api/`.

---

# Segurança

O objetivo atual é executar o projeto localmente em uma única máquina. Por isso, as medidas de segurança foram mantidas proporcionais ao cenário, sem adicionar infraestrutura desnecessária.

A versão atual possui:

- senhas armazenadas com `password_hash()`;
- verificação com `password_verify()`;
- senha mínima de 8 caracteres para novos cadastros e alterações;
- PDO;
- prepared statements;
- `PDO::ATTR_EMULATE_PREPARES = false`;
- cookies de sessão `HttpOnly`;
- `SameSite=Lax`;
- `session.use_strict_mode`;
- `session.use_only_cookies`;
- regeneração do ID de sessão após autenticação;
- regeneração da sessão após alteração de senha;
- expiração da sessão depois de 2 horas sem atividade;
- limite de 5 tentativas de login dentro de uma janela de 60 segundos;
- atualização automática do hash de senha quando necessário com `password_needs_rehash()`;
- bloqueio de requisições de escrita com `Origin` incompatível;
- header `X-Content-Type-Options: nosniff`;
- header `X-Frame-Options: DENY`;
- `Referrer-Policy: no-referrer`;
- `Permissions-Policy` restritiva para câmera, microfone e geolocalização;
- detalhes internos de erro ocultos por padrão;
- confirmação visual antes de ações destrutivas.

## Escopo das proteções

O sistema foi pensado para:

```text
XAMPP local
uma máquina
ambiente controlado
poucos usuários
```

Caso seja hospedado na internet no futuro, ainda será recomendado implementar:

- cargos e permissões;
- cadastro de usuários restrito;
- HTTPS obrigatório;
- CSRF token explícito;
- rate limiting persistente;
- recuperação segura de conta;
- auditoria detalhada;
- sincronização preparada para vários usuários simultâneos.

---

# Modelo de usuários

As contas representam usuários trabalhando na **mesma empresa**.

Clientes, produtos, vendas, pedidos, Controle Geral e configurações da empresa são compartilhados entre as contas autenticadas.

O sistema não cria uma empresa ou banco separado para cada usuário.

---

# Estrutura do projeto

```text
tcc/
├── index.html
├── cadastro.html
├── README.md
│
├── pages/
│   ├── home.html
│   ├── clientes.html
│   ├── produtos.html
│   ├── vendas.html
│   ├── pedidos.html
│   ├── financeiro.html
│   └── configuracoes.html
│
├── assets/
│   ├── css/
│   │   ├── auth.css
│   │   ├── home.css
│   │   ├── clientes.css
│   │   ├── produtos.css
│   │   ├── vendas.css
│   │   ├── pedidos.css
│   │   ├── financeiro.css
│   │   └── configuracoes.css
│   │
│   ├── js/
│   │   ├── auth.js
│   │   ├── backend-sync.js
│   │   ├── common.js
│   │   ├── home.js
│   │   ├── clientes.js
│   │   ├── produtos.js
│   │   ├── vendas.js
│   │   ├── pedidos.js
│   │   ├── financeiro.js
│   │   └── configuracoes.js
│   │
│   └── img/
│       ├── Logo1.png
│       └── wall.gif
│
├── backend/
│   ├── api/
│   │   ├── _bootstrap.php
│   │   ├── auth.php
│   │   ├── sync.php
│   │   └── maintenance.php
│   │
│   ├── modules/
│   │   ├── bootstrap.php
│   │   ├── auth.php
│   │   ├── clientes.php
│   │   ├── produtos.php
│   │   ├── vendas.php
│   │   ├── pedidos.php
│   │   ├── controle.php
│   │   ├── dashboard.php
│   │   ├── configuracoes.php
│   │   ├── atividades.php
│   │   └── diagnostico.php
│   │
│   └── config/
│       ├── conexao.php
│       └── database.php
│
├── database/
│   └── CriarBanco.sql
│
├── docs/
│   └── TCC estrutura..docx
│
└── tools/
    └── aplicar_integracao.php
```

---

# Arquivos importantes

| Arquivo | Função |
|---|---|
| `index.html` | Tela de login |
| `cadastro.html` | Criação de conta |
| `assets/js/auth.js` | Lógica de autenticação no front |
| `assets/js/backend-sync.js` | Ponte entre front-end e MySQL |
| `assets/js/common.js` | Componentes e utilidades compartilhadas |
| `backend/api/auth.php` | Autenticação principal |
| `backend/api/sync.php` | Sincronização dos dados |
| `backend/api/maintenance.php` | Limpeza e restauração |
| `backend/config/conexao.php` | Conexão PDO utilizada pela API principal |
| `database/CriarBanco.sql` | Criação limpa do banco |
| `backend/modules/diagnostico.php` | Diagnóstico do ambiente |
| `docs/TCC estrutura..docx` | Documento acadêmico mantido separadamente |

---

# Conexão MySQL

Por padrão, a API principal utiliza as configurações típicas do XAMPP:

```text
Host:     127.0.0.1
Porta:    3306
Banco:    velas_s_tome
Usuário:  root
Senha:    vazia
```

`backend/config/conexao.php` também permite sobrescrever essas credenciais através de variáveis de ambiente.

---

# Diagnóstico

Depois de importar o SQL, abra:

```text
http://localhost/tcc/backend/modules/diagnostico.php
```

O diagnóstico verifica:

- versão do PHP;
- extensão PDO MySQL;
- conexão com MySQL;
- tabelas;
- views;
- triggers;
- colunas `front_id` necessárias para a sincronização.

---

# Limitações conhecidas

## Uso concorrente

A sincronização atual trabalha com coleções completas.

Isso é adequado para o cenário principal do projeto:

```text
uso local
uma máquina
baixa concorrência
```

Caso vários computadores alterem os mesmos registros simultaneamente, pode ocorrer conflito do tipo **última gravação vence**.

Para uma futura versão multiusuário em rede, o recomendado é migrar o front progressivamente para os endpoints CRUD individuais de `backend/modules/`.

## Permissões

Atualmente não existem cargos como:

```text
Administrador
Gerente
Operador
```

Todos os usuários autenticados trabalham com os mesmos dados e possuem acesso às funções exibidas na interface.

Para o cenário local atual isso é aceitável. Em uma implantação pública, seria necessário adicionar controle de permissões.

## Recuperação de senha

Não existe fluxo automático de recuperação porque a autenticação atual não possui e-mail ou telefone dedicado à recuperação da conta.

---

# Fundo animado do login

A autenticação utiliza:

```text
assets/img/wall.gif
```

O GIF é relativamente grande.

Em execução local isso tende a ter pouco impacto prático.

Se o projeto for hospedado futuramente, é recomendável converter o fundo para **WebM ou MP4**, mantendo a animação com tamanho de arquivo menor.

---

# Documento acadêmico

O arquivo:

```text
docs/TCC estrutura..docx
```

é mantido separadamente do código-fonte e não é alterado automaticamente junto com o sistema.

---

# Status

**Projeto funcional em ambiente local / desenvolvimento avançado.**

Os principais módulos já estão integrados ao MySQL e podem ser utilizados pelo XAMPP.

---

# Autores

- [Julio Aparecido](https://github.com/JuuJap)
- [Julio Cesar](https://github.com/CesarNSR)
- [Matheus Bassi](https://github.com/Bassi1711)
