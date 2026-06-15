# ESPECIFICACAO DO CONTEXTO ADAPTADO (ARQUITETURA DO PROJETO GESTIFY)

> Documento espelhado de `Gestify-Backend/docs/ESPECIFICACAO_GESTIFY.md`.  
> Manter sincronizado ao alterar arquitetura, auth ou deploy.

## 1. Usuarios e Casos de Uso

### Perfis de usuario

- **Gestor / Administrador (Painel Gestify)**
  - Acessa o painel web administrativo com credenciais validadas no servidor.
  - Define o tema/segmento (confeitaria, varejo, delivery etc.).
  - Gerencia produtos, receitas, estoque, fornecedores, promocoes, logistica de entrega, cardapio digital e configuracoes gerais.
  - Gerencia **usuarios internos** (criar, editar, desativar operadores e admins) via modulo **Usuarios**.
  - Cadastra **clientes finais** (nome, telefone, endereco) via modulo **Clientes**, persistidos no PostgreSQL.
  - Tem acesso a area de marketing (IA), automacao e relatorios consolidados.
  - Unico perfil autorizado a: chave Gemini, reset de custos invisiveis e execucao de automacao.

- **Operador / Atendente de Loja (usuario interno)**
  - Compartilha o mesmo painel, focado em rotinas operacionais.
  - Atualiza estoque (entradas/saidas), registra pedidos, imprime etiquetas e acompanha promocoes.
  - Cadastra e consulta **clientes finais** no modulo **Clientes**.
  - **Nao** altera configuracoes estruturais (chaves de API, reset de banco, gestao de usuarios).

- **Cliente Final (Cardapio / Catalogo Publico)**
  - Acessa o cardapio digital publico (menu publico).
  - Visualiza itens, precos, promocoes e pode simular ou registrar pedidos em fluxo simplificado.
  - Nao possui conta de login no sistema; identificacao feita por nome/telefone no pedido.
  - Nao tem acesso ao painel interno nem a dados de gestao.

### Matriz de casos de uso e escopo de dados

- **Gestor / Administrador**
  - Dashboard operacional (visao geral de vendas, produtos e indicadores).
  - Precificacao (CRUD de produtos/receitas, custos visiveis e custos invisiveis).
  - Estoque (entradas/saidas, estoque minimo, alertas de ruptura e validade).
  - Fornecedores (cadastro e relacionamento de itens).
  - **Clientes** (CRUD de clientes finais no banco).
  - **Usuarios** (CRUD de operadores e administradores).
  - Etiquetas (geracao para gondola, lote e validade).
  - Promocoes e Marketing (combos, campanhas e IA para copy/arte).
  - Delivery e Logistica (pedidos, retirada, entrega e despacho).
  - Cardapio/Catalogo Digital (publicacao e sincronizacao).
  - Configuracoes (tema, chave Gemini e manutencao do ambiente).

- **Operador / Atendente**
  - Registra pedidos e atualiza status operacional.
  - Da baixa em estoque durante o atendimento.
  - Gera etiquetas conforme necessidade de exposicao/expedicao.
  - Consulta e cadastra clientes finais.

- **Cliente Final**
  - Usa o modulo publico para visualizar produtos e promocoes.
  - Simula/abre pedidos que entram no fluxo interno de operacao (`POST /api/orders`).

## 2. Arquitetura e Plataforma Tecnologica

- **Padrao de Arquitetura**
  - Repositorios separados: **Gestify-Backend** (API) e **PI** (frontend).
  - Backend em Node.js + Express + TypeORM, expondo API REST.
  - Frontend em React + Vite, consumindo API via HTTP (`apiFetch` com JWT).
  - **Producao:** backend implantado na **Vercel** (serverless); banco **PostgreSQL** hospedado no **Supabase**.
  - Em desenvolvimento, Vite faz proxy de `/api` para `localhost:3000`.

- **Backend (Gestify-Backend)**
  - Runtime: Node.js com `tsx` (dev) / bundle esbuild (Vercel).
  - Framework: Express.
  - Persistencia: PostgreSQL via TypeORM (SSL para Supabase).
  - Responsabilidades:
    - Inicializacao de banco, migracoes idempotentes e seeds.
    - Autenticacao JWT e controle de perfis (`admin` | `operator`).
    - Exposicao de rotas REST dos modulos de negocio.
    - Regras de precificacao/custos e agregacao de indicadores.
    - Integracao com Gemini para marketing.

- **Frontend (PI/Frontend)**
  - Biblioteca: React (SPA).
  - Bundler: Vite.
  - Estilos: Tailwind CSS v4 + tokens de tema.
  - Estado: hooks padrao (`useState`, `useEffect`).
  - Paginas principais:
    - `LoginPage`, `SignupPage`
    - `DashboardPage`, `PricingPage`, `InventoryPage`
    - `SuppliersPage`, `CustomersPage`, `UsersPage`
    - `LabelPage`, `PromotionsPage`, `MarketingPage`
    - `DeliveryLogisticsPage`, `MenuAdminPage`, `PublicMenuSimulator`
    - `SettingsPage`, `AssistantPage`

- **Banco de Dados (PostgreSQL / Supabase)**
  - Configurado por `DATABASE_URL`.
  - Entidades de negocio: `products`, `recipes`, `recipe_ingredients`, `invisible_costs`, `sales_history`, `promotions`, `suppliers`, `orders`.
  - Entidades de seguranca e CRM:
    - **`users`**: operadores e administradores (`username`, `password_hash`, `name`, `email`, `role`, `active`).
    - **`customers`**: clientes finais (`name`, `phone`, `email`, `address`, `notes`).

- **Infraestrutura e Ferramentas**
  - Backend (Gestify-Backend):
    - `npm run dev` — servidor local
    - `npm run vercel-build` — bundle para Vercel (`api/index.js`)
    - `npm run db:create`, `npm run db:seed`
  - Frontend (PI/Frontend):
    - `npm run dev`, `npm run build`
  - Deploy Vercel: `vercel.json` reescreve `/api/*` para handler serverless.

- **Autenticacao e Seguranca**
  - **Servidor (fonte da verdade):** credenciais e perfis armazenados na tabela `users`.
  - Senhas com hash **scrypt** (salt + hash); nunca persistidas em texto puro.
  - Sessao via **JWT** assinado com HMAC-SHA256 (`JWT_SECRET`).
  - Frontend envia `Authorization: Bearer <token>` em requisicoes autenticadas (`apiFetch`).
  - Token e dados do usuario em `localStorage` (`gestify_token`, `gestify_user`).
  - **Nao ha mais** admin hardcoded no frontend nem flag `gestify_auth = "true"`.
  - Middleware `requireAuth` protege rotas da API; `requireRole('admin')` restringe operacoes sensiveis.
  - Rotas **publicas** (sem token): `POST /api/auth/login`, `POST /api/auth/register` (condicional), `GET /api/products`, `POST /api/orders`.
  - Cadastro publico de operadores controlado por `ALLOW_PUBLIC_SIGNUP` (desligado por padrao apos existir admin).
  - Admin padrao criado no seed via `ADMIN_USERNAME` / `ADMIN_PASSWORD` (variaveis de ambiente).

## 3. Estrutura de Diretorios do Projeto

```text
Gestify-Backend/                    # API — deploy Vercel
├── api/
│   └── index.js                    # bundle serverless (gerado)
├── database/
│   ├── data-source.ts
│   ├── init.ts
│   ├── migrate-auth-tables.ts
│   └── migrate-image-url.ts
├── entities/
│   ├── User.ts
│   ├── Customer.ts
│   ├── Product.ts, Order.ts, ...
│   └── index.ts
├── middleware/
│   └── auth.middleware.ts
├── routes/
│   └── auth.routes.ts
├── repositories/
│   └── gestify.repository.ts
├── services/
│   ├── auth.service.ts
│   ├── assistant.service.ts
│   └── ...
├── seeds/
├── routes.ts
├── server.ts
├── vercel.json
└── docs/
    └── ESPECIFICACAO_GESTIFY.md

PI/                                 # Frontend
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── UsersPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── auth.ts             # login/register via API + JWT
│   │   │   └── api.ts              # apiFetch + withThemeQuery
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
└── Docs/
    └── Documento_de_Requisitos_Gestify.md
```

## 4. Convencoes e Configuracoes de Ambiente

### Padroes de codigo

- Linguagem: TypeScript (frontend e backend).
- Nomenclatura:
  - `camelCase` para funcoes/variaveis.
  - `PascalCase` para componentes e tipos.
  - `UPPER_SNAKE_CASE` para constantes e chaves de sistema.

### Mapeamento de variaveis de ambiente

- **Backend (Gestify-Backend / Vercel)**
  - `DATABASE_URL`:
    - Connection string PostgreSQL (Supabase).
    - Exemplo: `postgresql://postgres:***@db.xxxx.supabase.co:5432/postgres`
  - `JWT_SECRET`:
    - Chave secreta para assinar tokens JWT (obrigatoria em producao).
  - `ADMIN_USERNAME`:
    - Usuario numerico do administrador inicial (seed). Padrao: `1164`.
  - `ADMIN_PASSWORD`:
    - Senha do administrador inicial (seed). Definir valor forte em producao.
  - `ALLOW_PUBLIC_SIGNUP`:
    - `true` permite cadastro publico de operadores; omitido ou `false` exige convite do admin.
  - `GEMINI_API_KEY`:
    - Chave da API Gemini para o modulo de marketing.
  - `FRONTEND_URL`:
    - Origem permitida no CORS (URL do frontend em producao).
  - `VERCEL`:
    - Definido automaticamente na Vercel; desativa `synchronize` do TypeORM.

- **Frontend (PI/Frontend)**
  - Consumo da API por caminhos relativos (`/api/...`) com proxy Vite em dev.
  - Opcionalmente, `VITE_API_URL` em deploy desacoplado apontando para a URL da API na Vercel.

## 5. Modulos Tecnicos-Chave

- **Backend**
  - `server.ts`: bootstrap, CORS, swagger, inicializacao de banco por request (`/api/*`).
  - `database/init.ts`: conexao, migracoes (`migrate-auth-tables`, `migrate-image-url`), seed de admin e dados demo.
  - `services/auth.service.ts`: hash de senha, JWT, CRUD de usuarios.
  - `middleware/auth.middleware.ts`: `requireAuth`, `requireRole`.
  - `routes/auth.routes.ts`: login, register, me, gestao de usuarios (admin).
  - `routes.ts`: endpoints REST de negocio + clientes; rotas publicas e protegidas.
  - `repositories/gestify.repository.ts`: persistencia de produtos, pedidos, clientes etc.
  - `gemini.ts`: integracao com Gemini.

- **Frontend**
  - `App.tsx`: gate de autenticacao, roteamento por abas, tema, refresh de sessao.
  - `lib/auth.ts`: login/register via API, armazenamento de JWT, `isAdmin()`.
  - `lib/api.ts`: `apiFetch` (header Authorization) e `withThemeQuery`.
  - `pages/LoginPage.tsx`, `SignupPage.tsx`: autenticacao assincrona com backend.
  - `pages/UsersPage.tsx`: gestao de usuarios (somente admin).
  - `pages/CustomersPage.tsx`: cadastro de clientes finais.
  - `pages/MarketingPage.tsx`: geracao de copys e artes com IA.
  - `components/Sidebar.tsx`: menu com abas Clientes e Usuarios (admin).

## 6. API REST — Autenticacao e Acesso

### Rotas de autenticacao (`/api/auth`)

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/api/auth/login` | Publica | Login; retorna `{ token, user }` |
| POST | `/api/auth/register` | Publica* | Cadastro de operador (*se permitido) |
| GET | `/api/auth/me` | Token | Dados do usuario logado |
| GET | `/api/auth/users` | Admin | Lista usuarios |
| POST | `/api/auth/users` | Admin | Cria usuario |
| PUT | `/api/auth/users/:id` | Admin | Atualiza usuario |
| DELETE | `/api/auth/users/:id` | Admin | Remove usuario |

### Rotas de clientes (`/api/customers`)

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/api/customers` | Token | Lista clientes |
| POST | `/api/customers` | Token | Cadastra cliente |
| PUT | `/api/customers/:id` | Token | Atualiza cliente |
| DELETE | `/api/customers/:id` | Token | Remove cliente |

### Rotas publicas vs protegidas (negocio)

| Rotas publicas (sem token) | Rotas protegidas (token obrigatorio) |
|----------------------------|--------------------------------------|
| `GET /api/products` | Dashboard, receitas, estoque (escrita), fornecedores, promocoes, marketing, pedidos (leitura/alteracao), assistente |
| `POST /api/orders` | `GET/POST/PUT/DELETE /api/customers` |
| `POST /api/auth/login` | Demais metodos de produtos, receitas, pedidos etc. |
| `POST /api/auth/register`* | |

### Rotas exclusivas de administrador

- `POST /api/settings/gemini-key`
- `POST /api/invisible-costs` (reset de custos)
- `POST /api/automation/run`
- CRUD em `/api/auth/users`

## 7. Fluxo de Autenticacao

```text
[LoginPage]
    │
    ▼ POST /api/auth/login { username, password }
[Backend auth.service]
    │ verifica scrypt na tabela users
    ▼
{ token: JWT, user: { id, username, name, email, role } }
    │
    ▼ localStorage: gestify_token + gestify_user
[App.tsx] authenticated = true
    │
    ▼ apiFetch("/api/...") + Authorization: Bearer <token>
[Backend requireAuth] valida JWT → req.user
    │
    ▼ requireRole('admin') quando aplicavel
[Resposta ou 401/403]
```

### Bootstrap inicial (primeiro deploy)

1. Cold start na Vercel executa `migrateAuthTables()` (cria `users` e `customers`).
2. Se tabela `users` vazia, `seedDefaultAdmin()` cria admin com `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
3. Admin faz login e cadastra operadores em **Usuarios** ou habilita `ALLOW_PUBLIC_SIGNUP`.

## 8. Historico de Evolucao (seguranca)

| Versao anterior (MVP) | Versao atual |
|-----------------------|--------------|
| Admin hardcoded no frontend (`auth.ts`) | Admin no PostgreSQL + env vars |
| `localStorage.gestify_auth = "true"` | JWT assinado no servidor |
| Senhas em texto puro (`gestify_users`) | Hash scrypt no banco |
| API totalmente aberta | Middleware de autenticacao e perfis |
| Cadastro local de operadores | Cadastro via API com controle de permissao |
| Cliente apenas como campo em pedido | Entidade `customers` com CRUD dedicado |
