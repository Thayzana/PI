# Gestify

Sistema de gestão para confeitarias e comércio/varejo.

## Estrutura

```
PI/
├── Frontend/    # React + Vite (porta 5173)
├── Docs/        # Requisitos e especificação
└── docker-compose.yml

Gestify-Backend/ # Repositório separado — API Express + TypeORM (Vercel + Supabase)
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- API: projeto **Gestify-Backend** (local ou Vercel)
- PostgreSQL (local, Docker ou Supabase)

## Configuração

### Backend (Gestify-Backend)

```bash
cd ../Gestify-Backend
npm install
cp .env.example .env.local   # se existir; ou crie .env.local
```

Variáveis principais em `.env.local`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/gestify"
JWT_SECRET="sua-chave-secreta-longa"
ADMIN_USERNAME="1164"
ADMIN_PASSWORD="sua-senha-forte"
GEMINI_API_KEY="sua-chave-gemini"
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Primeira vez (banco local):

```bash
npm run db:create
npm run db:seed
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env.local
```

Para apontar o proxy do Vite para a API na Vercel:

```env
VITE_API_PROXY_TARGET=https://seu-backend.vercel.app
```

Padrão local: `http://localhost:3000`

## Executar (dois terminais)

**Terminal 1 — API (Gestify-Backend):**

```bash
cd ../Gestify-Backend
npm run dev
```

**Terminal 2 — Interface:**

```bash
cd Frontend
npm run dev
```

- App: http://localhost:5173  
- API local: http://localhost:3000  

## Login

Use o administrador criado no seed (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).  
Operadores são cadastrados pelo admin em **Usuários** no painel.

## Documentação

- `Docs/ESPECIFICACAO_GESTIFY.md` — arquitetura, auth JWT e API  
- `Docs/Documento_de_Requisitos_Gestify.md` — requisitos funcionais  

## Docker

Requisitos: Docker Compose v2.

```bash
docker compose up --build
```

| Serviço    | URL |
|------------|-----|
| App (UI)   | http://localhost:8080 |
| PostgreSQL | `localhost:5432` |

A API **não** sobe mais neste compose (fica no Gestify-Backend).  
O nginx do frontend encaminha `/api` para `API_UPSTREAM` (padrão: `http://host.docker.internal:3000`).

Para usar a API na Vercel:

```bash
API_UPSTREAM=https://seu-backend.vercel.app docker compose up --build
```

Parar:

```bash
docker compose down
```
