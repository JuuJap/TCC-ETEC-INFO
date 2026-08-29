# Velas S. Tomé — ERP de Pequeno Porte

Sistema web full-stack desenvolvido como Trabalho de Conclusão de Curso (TCC) com o objetivo de centralizar e integrar processos administrativos da **Velas S. Tomé** em uma única aplicação.

O projeto foi concebido como um **ERP de pequeno porte**, direcionado ao contexto de uma pequena empresa. Seu foco é reunir, em uma mesma base de dados, informações de clientes, produtos, vendas, pedidos, movimentações financeiras, controle de peso, usuários e configurações da empresa.

A proposta não é reproduzir todos os módulos encontrados em grandes ERPs comerciais, mas aplicar os principais conceitos de um sistema integrado de gestão empresarial dentro do escopo real do negócio.

---

# Visão geral

O Velas S. Tomé funciona como um sistema integrado:

```text
Clientes ───────┐
                ├────► Pedidos ─────► Controle Geral
Produtos ───────┘          │
                           ├────► Valor
                           └────► Peso

Vendas ───────────────────► Controle Geral

Todos os módulos ─────────► Dashboard / Atividades

Configurações ────────────► Empresa / Aparência / Segurança
```

A integração entre os módulos é um dos principais elementos que caracterizam o projeto como um ERP.

Uma informação cadastrada em um módulo pode ser reutilizada por outros módulos, evitando repetição manual de dados e mantendo os registros centralizados no mesmo banco MySQL.

---

# Objetivo

O sistema tem como objetivo auxiliar no gerenciamento interno de uma pequena empresa, oferecendo uma solução simples e integrada para:

- centralizar dados administrativos;
- cadastrar e consultar clientes;
- manter um catálogo de produtos;
- registrar vendas;
- elaborar pedidos;
- acompanhar entradas e saídas financeiras;
- acompanhar entradas e saídas de peso;
- gerar informações resumidas no dashboard;
- registrar atividades realizadas no sistema;
- manter dados da empresa;
- controlar acesso através de contas de usuário.

O projeto foi desenvolvido principalmente para **uso local em uma única máquina**, utilizando XAMPP, PHP e MySQL.

---

# Conceito de ERP aplicado ao projeto

ERP significa **Enterprise Resource Planning**, ou Planejamento dos Recursos Empresariais.

No contexto deste projeto, o conceito é aplicado principalmente através da integração entre diferentes áreas da gestão.

Exemplos:

```text
Cliente cadastrado
        ↓
Pode ser selecionado em um Pedido
        ↓
Endereço é preenchido automaticamente
```

```text
Produto cadastrado
        ↓
Pode ser selecionado em um Pedido
        ↓
Valor e peso podem ser reutilizados
```

```text
Pedido salvo
        ↓
Gera entrada financeira
        +
Gera saída de peso
        ↓
Controle Geral
```

```text
Venda registrada
        ↓
Gera entrada financeira
        ↓
Controle Geral
```

Assim, os módulos não funcionam apenas como páginas independentes: eles compartilham dados e participam do mesmo fluxo administrativo.

---

# Tecnologias utilizadas

## Front-end

- HTML5;
- CSS3;
- JavaScript;
- Web Components;
- `sessionStorage`;
- `localStorage`;
- File System Access API quando disponível;
- API de impressão do navegador.

## Back-end

- PHP 8+;
- sessões PHP;
- APIs JSON;
- PDO;
- prepared statements.

## Banco de dados

- MySQL ou MariaDB;
- tabelas relacionais;
- chaves estrangeiras;
- índices;
- views;
- triggers;
- constraints.

## Ambiente recomendado

- XAMPP;
- Apache;
- MySQL/MariaDB;
- navegador moderno.

---

# Arquitetura

Fluxo simplificado da aplicação:

```text
Navegador
   │
   ├── HTML
   ├── CSS
   └── JavaScript
          │
          ▼
 assets/js/backend-sync.js
          │
          ▼
     APIs PHP
          │
          ▼
        MySQL
```

A aplicação utiliza PHP como camada de servidor e MySQL para persistência definitiva dos dados.

O JavaScript continua responsável pela interação da interface, validações e comportamento das páginas.

---

# Instalação com XAMPP

## 1. Copie o projeto para o `htdocs`

Coloque a pasta do projeto em:

```text
C:\xampp\htdocs\tcc\
```

A estrutura principal deverá ser semelhante a:

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

## 2. Inicie o XAMPP

Abra o XAMPP Control Panel e inicie:

```text
Apache
MySQL
```

## 3. Importe o banco de dados

Abra:

```text
http://localhost/phpmyadmin/
```

No phpMyAdmin:

1. escolha **Importar**;
2. selecione:

```text
database/CriarBanco.sql
```

3. execute a importação.

O próprio arquivo cria o banco:

```text
velas_s_tome
```

Não é necessário criar o banco manualmente.

> O arquivo SQL cria a estrutura do sistema sem inserir usuários, clientes, produtos, vendas, pedidos ou outros registros iniciais.

## 4. Abra o sistema

Acesse:

```text
http://localhost/tcc/
```

Esta versão não deve ser executada pelo Live Server, pois autenticação, sessões e persistência dependem do Apache/PHP.

## 5. Crie a primeira conta

O banco é criado sem usuários.

Na tela inicial:

```text
Criar conta
```

Regras atuais:

```text
Usuário: mínimo de 3 caracteres
Senha: mínimo de 8 caracteres
```

Depois do cadastro, faça login normalmente.

---

# URLs úteis

| Recurso | Endereço |
|---|---|
| Sistema | `http://localhost/tcc/` |
| Cadastro | `http://localhost/tcc/cadastro.html` |
| phpMyAdmin | `http://localhost/phpmyadmin/` |
| Diagnóstico | `http://localhost/tcc/backend/modules/diagnostico.php` |

---

# Módulos do ERP

## 1. Autenticação

O sistema possui autenticação integrada ao MySQL.

Funcionalidades:

- criação de contas;
- login por usuário e senha;
- sessão PHP;
- logout no servidor;
- alteração de senha;
- verificação automática da sessão;
- redirecionamento para a Home após autenticação;
- opção de lembrar apenas o nome do usuário;
- limite de tentativas consecutivas de login.

As senhas são armazenadas através de `password_hash()` e verificadas com `password_verify()`.

O sistema não armazena senhas em texto puro.

---

## 2. Home / Dashboard

A Home funciona como painel inicial do ERP.

Exibe dados reais cadastrados no sistema:

- quantidade de clientes;
- quantidade de produtos;
- quantidade de vendas;
- variação mensal;
- distribuição de registros do mês;
- data atual;
- ações rápidas;
- atividades recentes.

Os percentuais não são valores fixos.

A variação dos cards é calculada com base nos registros do mês atual em comparação ao mês anterior.

Quando não existem dados:

```text
0%
```

O painel mensal utiliza registros reais de:

- vendas;
- novos clientes;
- pedidos;
- produtos.

---

## 3. Clientes

O módulo de Clientes permite:

- cadastrar clientes;
- editar cadastros;
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

Status possíveis:

```text
Ativo
Inativo
```

### Integração com Pedidos

Clientes cadastrados podem ser selecionados durante a criação de pedidos.

Ao selecionar um cliente, o sistema pode preencher automaticamente:

```text
Endereço
Cidade
```

reduzindo a necessidade de digitação repetida.

---

## 4. Produtos

O módulo de Produtos funciona como catálogo utilizado pelo ERP.

Permite:

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

- valor unitário é opcional;
- peso unitário é obrigatório;
- valor aceita casas decimais;
- peso aceita casas decimais.

### Integração com Pedidos

Ao selecionar um produto cadastrado em um Pedido, o sistema pode preencher automaticamente:

```text
Descrição
Valor unitário
Peso unitário
```

O usuário ainda pode ajustar os valores durante a montagem do pedido quando necessário.

---

## 5. Vendas

O módulo Vendas registra operações comerciais independentes dos Pedidos.

Campos principais:

```text
Cliente / descrição
Valor
Data e hora
```

### Integração com Controle Geral

Ao registrar uma venda:

```text
Venda
  ↓
Entrada financeira
  ↓
Controle Geral
```

O banco utiliza triggers para manter essa integração.

Venda não movimenta peso automaticamente.

---

## 6. Pedidos

Pedidos é um dos principais módulos do ERP.

Permite:

- numeração sequencial;
- seleção de cliente cadastrado;
- cliente digitado manualmente;
- preenchimento automático de endereço;
- seleção de produtos cadastrados;
- preenchimento automático de valor e peso;
- vários itens no mesmo pedido;
- definição de quantidade;
- valores decimais;
- pesos decimais;
- cálculo automático por item;
- cálculo do valor total;
- cálculo do peso total;
- edição de itens;
- exclusão de itens;
- salvar pedido;
- visualizar;
- editar;
- excluir;
- pesquisar no histórico;
- baixar pedido em `.txt`;
- imprimir;
- salvar como PDF através do navegador.

### Dados da empresa

Quando configurados, os documentos podem utilizar:

```text
Nome da empresa
Telefone
Endereço
CNPJ
```

### Integração com Controle Geral

Um Pedido salvo representa:

```text
Entrada financeira
+
Saída de peso
```

Fluxo:

```text
Pedido
  │
  ├────► Valor total ─────► Entrada financeira
  │
  └────► Peso total ──────► Saída de peso
                              │
                              ▼
                        Controle Geral
```

Quando o pedido é alterado, sua movimentação vinculada também é atualizada.

Quando o pedido é excluído, a movimentação vinculada é removida.

---

## 7. Controle Geral

O módulo exibido na interface como **Controle Geral** reúne dois controles administrativos.

### Controle financeiro

```text
Entradas
Saídas
Saldo
```

### Controle de peso

```text
Entradas
Saídas
Saldo
```

Uma movimentação manual pode conter:

- somente valor;
- somente peso;
- valor e peso ao mesmo tempo.

O histórico também recebe movimentações automáticas provenientes de:

```text
Vendas
Pedidos
```

Alguns arquivos ainda utilizam o nome `financeiro` internamente por compatibilidade com versões anteriores do projeto.

---

## 8. Configurações

### Aparência

Temas disponíveis:

```text
Claro
Escuro
Automático
```

Quando ainda não existe preferência registrada, o sistema inicia no tema escuro.

### Dados da empresa

Permite definir:

```text
Nome
Telefone
Endereço
CNPJ
```

Essas informações são persistidas no MySQL.

Podem ser utilizadas na interface e nos documentos de Pedido.

### Conta e segurança

O usuário autenticado pode alterar sua senha.

É necessário informar:

- senha atual;
- nova senha;
- confirmação da nova senha.

A nova senha deve possuir pelo menos 8 caracteres.

### Resumo do sistema

A página exibe as quantidades atuais de:

- clientes;
- produtos;
- vendas;
- pedidos.

### Gerenciamento dos dados

#### Restaurar dados de exemplo

Cria registros preparados para demonstração do ERP.

Essa operação é opcional e não ocorre durante a instalação.

#### Limpar dados do sistema

Remove dados operacionais:

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

A operação exige duas confirmações.

---

# Atividades

O ERP registra atividades administrativas para alimentar o histórico da Home.

As atividades ajudam a visualizar ações recentes realizadas no sistema e estão associadas ao usuário responsável quando aplicável.

---

# Diálogos e notificações

O sistema não depende das caixas nativas do navegador:

```javascript
alert()
confirm()
prompt()
```

Foram implementados componentes próprios.

### Toasts

Utilizados para mensagens rápidas, como:

```text
Cadastro salvo
Operação concluída
Alteração realizada
```

### Modais de confirmação

Utilizados para ações que exigem decisão do usuário, como:

- logout;
- exclusão de cliente;
- exclusão de produto;
- exclusão de pedido;
- limpeza de atividades;
- restauração de dados;
- limpeza dos dados operacionais.

Isso mantém a identidade visual do sistema consistente.

---

# Banco de dados

Arquivo:

```text
database/CriarBanco.sql
```

Banco criado:

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

## Relacionamentos

O banco utiliza chaves estrangeiras para manter integridade entre as entidades.

Exemplos:

```text
Usuários
   ↓
Atividades
```

```text
Pedidos
   ↓
Itens do Pedido
```

## Views

```text
vw_dashboard_resumo
vw_controle_geral_resumo
```

As views auxiliam na consulta resumida dos dados administrativos.

## Triggers

O banco utiliza triggers para automatizar regras do ERP.

Entre elas:

- recalcular valor total do Pedido;
- recalcular peso total do Pedido;
- criar movimentação financeira proveniente de Venda;
- atualizar movimentação de Venda;
- criar/atualizar movimentação vinculada a Pedido.

Esse comportamento reduz a dependência de cálculos manuais e mantém módulos integrados.

## Banco inicial vazio

A instalação não cria registros de negócio.

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

Os comandos `INSERT` existentes dentro de triggers são regras do sistema e somente são executados conforme a aplicação é utilizada.

---

# Sincronização entre Front-end e MySQL

O front-end do projeto foi desenvolvido inicialmente utilizando armazenamento no navegador.

A integração com MySQL foi adicionada posteriormente através de:

```text
assets/js/backend-sync.js
```

Fluxo:

```text
Página administrativa
        ↓
backend-sync.js
        ↓
backend/api/sync.php
        ↓
MySQL
        ↓
Estado utilizado pelo JavaScript
        ↓
Interface
```

O sincronizador:

1. consulta os dados persistidos;
2. hidrata as estruturas utilizadas pelo front;
3. observa alterações;
4. envia atualizações ao PHP;
5. mantém os dados sincronizados com o MySQL.

As colunas `front_id` são utilizadas para manter a identidade dos registros entre navegador e banco.

Algumas chaves internas ainda contêm a palavra `Temporario` por compatibilidade com versões anteriores do front-end. Os registros, porém, são persistidos no MySQL.

---

# Back-end

## API principal

O front atual utiliza principalmente:

```text
backend/api/
├── _bootstrap.php
├── auth.php
├── sync.php
└── maintenance.php
```

Responsabilidades:

### `auth.php`

- cadastro;
- login;
- logout;
- sessão;
- alteração de senha.

### `sync.php`

- leitura dos dados do ERP;
- persistência das coleções;
- sincronização com o front-end.

### `maintenance.php`

- restauração de dados de demonstração;
- limpeza de dados operacionais.

## API modular

Também existe:

```text
backend/modules/
```

com endpoints independentes para:

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

Essa estrutura permanece disponível para uma futura evolução do sistema para operações CRUD individuais diretamente pela API.

---

# Segurança

O projeto foi pensado para execução local em ambiente controlado. Mesmo assim, foram aplicadas medidas básicas de segurança.

A versão atual possui:

- `password_hash()`;
- `password_verify()`;
- `password_needs_rehash()`;
- senha mínima de 8 caracteres para novos cadastros e alterações;
- PDO;
- prepared statements;
- `PDO::ATTR_EMULATE_PREPARES = false`;
- sessões PHP;
- cookie de sessão próprio;
- `HttpOnly`;
- `SameSite=Lax`;
- `session.use_strict_mode`;
- `session.use_only_cookies`;
- regeneração do ID da sessão após login;
- regeneração após alteração de senha;
- timeout por inatividade;
- limitação de tentativas consecutivas de login;
- verificação de origem para requisições de escrita;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: no-referrer`;
- `Permissions-Policy` restritiva;
- detalhes internos de erro ocultados;
- confirmação antes de operações destrutivas.

### Limite de tentativas

Atualmente:

```text
5 tentativas incorretas
em uma janela de 60 segundos
```

podem causar bloqueio temporário de novas tentativas.

### Tempo de sessão

Após aproximadamente:

```text
2 horas sem atividade
```

a sessão pode expirar.

---

# Modelo de usuários

O sistema representa uma única empresa.

As contas cadastradas são usuários internos que trabalham sobre a mesma base empresarial.

Portanto:

```text
Usuário A ─┐
Usuário B ─┼──► Mesma empresa
Usuário C ─┘
```

Eles compartilham:

- clientes;
- produtos;
- vendas;
- pedidos;
- Controle Geral;
- configurações da empresa.

O sistema não cria uma empresa ou banco separado para cada usuário.

Esse modelo é adequado ao objetivo de um ERP interno utilizado pela equipe de uma pequena empresa.

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

# Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Login |
| `cadastro.html` | Criação de conta |
| `pages/home.html` | Dashboard |
| `pages/clientes.html` | Gestão de clientes |
| `pages/produtos.html` | Gestão de produtos |
| `pages/vendas.html` | Registro de vendas |
| `pages/pedidos.html` | Gestão de pedidos |
| `pages/financeiro.html` | Controle Geral |
| `pages/configuracoes.html` | Configurações |
| `assets/js/auth.js` | Autenticação no front-end |
| `assets/js/backend-sync.js` | Sincronização front/MySQL |
| `assets/js/common.js` | Componentes e funções compartilhadas |
| `backend/api/auth.php` | Autenticação no servidor |
| `backend/api/sync.php` | Sincronização |
| `backend/api/maintenance.php` | Manutenção dos dados |
| `backend/config/conexao.php` | Conexão PDO |
| `database/CriarBanco.sql` | Estrutura limpa do banco |
| `backend/modules/diagnostico.php` | Diagnóstico do ambiente |
| `docs/TCC estrutura..docx` | Documento acadêmico separado do código |

---

# Configuração padrão do MySQL

A API principal está preparada para o padrão do XAMPP:

```text
Host:     127.0.0.1
Porta:    3306
Banco:    velas_s_tome
Usuário:  root
Senha:    vazia
```

O arquivo:

```text
backend/config/conexao.php
```

também permite sobrescrever as credenciais através de variáveis de ambiente.

---

# Diagnóstico

Depois da instalação, é possível verificar o ambiente em:

```text
http://localhost/tcc/backend/modules/diagnostico.php
```

O diagnóstico verifica:

- versão do PHP;
- extensão PDO MySQL;
- conexão com banco;
- tabelas;
- views;
- triggers;
- colunas `front_id`.

---

# Escopo atual do ERP

O projeto implementa módulos adequados ao contexto atual da Velas S. Tomé.

Atualmente estão incluídos:

```text
Autenticação
Dashboard
Clientes
Produtos
Vendas
Pedidos
Controle financeiro
Controle de peso
Configurações
Atividades
```

Não fazem parte do escopo atual módulos tradicionais de ERPs maiores, como:

```text
Recursos Humanos
Folha de pagamento
Fiscal
Contabilidade completa
Compras
Fornecedores
Estoque avançado
Logística
```

A ausência desses módulos não impede a classificação do projeto como ERP de pequeno porte, pois o sistema foi desenvolvido com escopo direcionado às necessidades administrativas da empresa.

---

# Limitações conhecidas

## Uso simultâneo

A sincronização atual trabalha principalmente com coleções completas.

Ela é adequada ao cenário principal:

```text
uso local
uma máquina
poucos usuários
baixa concorrência
```

Em um cenário com várias máquinas realizando alterações simultaneamente, pode ocorrer conflito de última gravação.

Uma evolução futura pode migrar progressivamente o front para operações CRUD individuais através de `backend/modules/`.

## Permissões

Atualmente todos os usuários autenticados possuem acesso às funções disponíveis no ERP.

Não existem cargos como:

```text
Administrador
Gerente
Operador
```

Para uso local isso atende ao escopo atual.

Em uma implantação maior, seria recomendado implementar níveis de permissão.

## Recuperação de senha

Não existe recuperação automática de conta porque a autenticação atual não possui e-mail ou telefone dedicado à recuperação.

---

# Fundo animado do login

A autenticação utiliza:

```text
assets/img/wall.gif
```

O GIF possui alta qualidade e é adequado ao uso local.

Por ser um arquivo relativamente grande, em uma futura hospedagem web pode ser convertido para:

```text
WebM
MP4
```

mantendo a animação com menor tamanho de transferência.

---

# Documento acadêmico

O arquivo:

```text
docs/TCC estrutura..docx
```

é mantido separado do código da aplicação.

Alterações no sistema não modificam automaticamente esse documento.

---

# Possíveis evoluções

O ERP pode ser ampliado futuramente com:

- fornecedores;
- compras;
- estoque;
- matérias-primas;
- produção;
- relatórios;
- gráficos avançados;
- níveis de acesso;
- backup e restauração;
- exportação de relatórios;
- integração fiscal;
- implantação em rede;
- hospedagem;
- acesso por múltiplas máquinas;
- API CRUD direta em todos os módulos.

---

# Status

**ERP de pequeno porte funcional em ambiente local.**

A versão atual possui front-end, PHP e MySQL integrados e está preparada para execução com XAMPP.

Os principais fluxos administrativos estão conectados a uma única base de dados, permitindo que informações de diferentes módulos sejam compartilhadas e utilizadas de forma integrada.

---

# Autores

- [Julio Aparecido](https://github.com/JuuJap)
- [Julio Cesar](https://github.com/CesarNSR)
- [Matheus Bassi](https://github.com/Bassi1711)
