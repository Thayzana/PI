# Gestify

Sistema de gestão para confeitarias, docerias, cafeterias, hamburguerias e varejo — com precificação, estoque, pedidos, cardápio digital e marketing com IA.

## Repositórios

O projeto é dividido em dois repositórios:

| Repositório | Conteúdo | Deploy |
|-------------|----------|--------|
| **[PI3](https://github.com/Thayzana/PI3)** (este) | Frontend React + Docker Compose local | Frontend estático / nginx |
| **[Gestify-Backend2](https://github.com/Thayzana/Gestify-Backend2)** | API Express + TypeORM | Vercel (serverless) + PostgreSQL (Supabase) |

## Estrutura

```
PI3/
├── Frontend/           # React 19 + Vite + Tailwind CSS v4 (porta 5173)
├── Docs/               # Requisitos e especificação técnica
└── docker-compose.yml  # Frontend + PostgreSQL local

Gestify-Backend2/       # Repositório irmão — API REST (porta 3000)
```

## Módulos do painel

- **Assistente Inteligente** — chat com IA para apoio operacional
- **Dashboard** — indicadores e visão geral
- **Entrega e Logística** — pedidos, retirada e despacho
- **Estoque** — entradas, saídas e alertas de ruptura
- **Etiquetas** — geração para gôndola, lote e validade
- **Cardápio** — administração do catálogo digital
- **Cardápio Cliente** — simulador / menu público (QR Code)
- **IA Marketing** — copy e campanhas com Gemini
- **Precificação** — produtos, receitas e custos invisíveis
- **Promoções** — combos e campanhas
- **Fornecedores** — cadastro e itens fornecidos
- **Clientes** — CRM de clientes finais
- **Usuários** *(admin)* — operadores e administradores
- **Configurações** — tema, chave Gemini e manutenção

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (recomendado 20+)
- [Gestify-Backend2](https://github.com/Thayzana/Gestify-Backend2) clonado ao lado deste repositório
- PostgreSQL (local, Docker ou [Supabase](https://supabase.com/))

## Configuração

### Backend (Gestify-Backend2)

```bash
cd ../Gestify-Backend2
npm install
cp .env.example .env
```

Variáveis principais em `.env` (ou `.env.local`):

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/gestify"
JWT_SECRET="sua-chave-secreta-longa"
ADMIN_USERNAME="1164"
ADMIN_PASSWORD="sua-senha-forte"
GEMINI_API_KEY="sua-chave-gemini"
PORT=3000
FRONTEND_URL=http://localhost:5173
# ALLOW_PUBLIC_SIGNUP=true   # opcional: cadastro público de operadores
```

Primeira vez (banco local):

```bash
npm run db:create
npm run db:seed
npm run dev
```

Outros scripts úteis:

```bash
npm run db:migrate   # migrações idempotentes (ex.: image_url)
npm test             # testes com Vitest
npm run lint         # verificação TypeScript
```

Documentação interativa da API (dev local):

- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api-docs.json

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env.local
```

`.env.local`:

```env
# Proxy do Vite em dev (/api → backend)
VITE_API_PROXY_TARGET=http://localhost:3000

# URL pública do cardápio (QR Code). Ex.: https://seu-dominio.com/cardapio
# VITE_PUBLIC_MENU_BASE_URL=http://localhost:5173/cardapio
```

Para apontar o proxy para a API na Vercel:

```env
VITE_API_PROXY_TARGET=https://seu-backend.vercel.app
```

## Executar (dois terminais)

**Terminal 1 — API:**

```bash
cd ../Gestify-Backend2
npm run dev
```

**Terminal 2 — Interface:**

```bash
cd Frontend
npm run dev
```

| Serviço | URL |
|---------|-----|
| App (dev) | http://localhost:5173 |
| API local | http://localhost:3000 |
| Health check | http://localhost:3000/health |

## Login e autenticação

A autenticação é feita **no servidor** via JWT (`POST /api/auth/login`).

1. Na primeira execução, o seed cria um administrador com `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
2. Faça login no painel com essas credenciais.
3. O token fica em `localStorage` (`gestify_token`) e é enviado em todas as requisições autenticadas.
4. Admins cadastram **operadores** em **Usuários**; operadores têm acesso operacional, sem configurações sensíveis.
5. Cadastro público (`/signup`) só funciona se `ALLOW_PUBLIC_SIGNUP=true` e ainda não existir admin.

Perfis: `admin` (acesso total) e `operator` (rotinas de loja).

## Cardápio público

Rotas públicas (sem login no painel):

- Simulador interno: aba **Cardápio Cliente** no painel
- Standalone: `/cardapio` (ou URL configurada em `VITE_PUBLIC_MENU_BASE_URL`)

Endpoints públicos da API: `GET /api/products`, `POST /api/orders`.

## Documentação

- [`Docs/ESPECIFICACAO_GESTIFY.md`](Docs/ESPECIFICACAO_GESTIFY.md) — arquitetura, auth JWT, API e deploy
- [`Docs/Documento_de_Requisitos_Gestify.md`](Docs/Documento_de_Requisitos_Gestify.md) — requisitos funcionais

## Docker

Requisitos: Docker Compose v2.

```bash
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| App (UI) | http://localhost:8080 |
| PostgreSQL | `localhost:5432` (user/senha/db: `postgres`/`postgres`/`gestify`) |

A API **não** sobe neste compose — rode **Gestify-Backend2** localmente ou aponte para a Vercel.

O nginx do frontend encaminha `/api` para `API_UPSTREAM` (padrão: `http://host.docker.internal:3000`).

Para usar a API na Vercel:

```bash
API_UPSTREAM=https://seu-backend.vercel.app docker compose up --build
```

Parar:

```bash
docker compose down
```

## Deploy em produção

- **Backend:** Vercel (`npm run vercel-build` gera `api/index.js`). Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` e demais variáveis no painel da Vercel.
- **Frontend:** build estático (`npm run build` em `Frontend/`) servido por nginx, Vercel ou similar. Ajuste `VITE_PUBLIC_MENU_BASE_URL` no build se usar cardápio público com domínio próprio.
- **Banco:** PostgreSQL gerenciado (ex.: Supabase). Rode `db:seed` uma vez após provisionar o banco.
