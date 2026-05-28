# Gestify

Sistema de gestão para confeitarias e comércio/varejo.

## Estrutura

```
gestify/
├── Frontend/    # React + Vite (porta 5173)
├── Backend/     # API Express + TypeORM (porta 3000)
└── README.md
```

Frontend e Backend são **projetos independentes**, cada um com seu próprio `package.json`.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) em execução (porta `5432`)

## Configuração

### Backend

```bash
cd Backend
npm install
copy .env.example .env.local
```

Edite `Backend/.env.local`:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/gestify"
GEMINI_API_KEY="sua-chave-gemini-aqui"
PORT=3000
```

Criar banco e popular dados (primeira vez):

```bash
npm run db:create
npm run db:seed
```

### Frontend

```bash
cd Frontend
npm install
```

O Vite encaminha `/api` para `http://localhost:3000` automaticamente.

## Executar (dois terminais)

**Terminal 1 — API:**

```bash
cd Backend
npm run dev
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/api-docs  

**Terminal 2 — Interface:**

```bash
cd Frontend
npm run dev
```

- App: http://localhost:5173  

## Login

| Campo   | Valor   |
|---------|---------|
| Usuário | `1164`  |
| Senha   | `19735` |

## Documentação adicional

- `Backend/docs/ESPECIFICACAO_GESTIFY.md` — arquitetura e casos de uso  
- `Backend/docs/testing.md` — plano de testes TDD  

## Produção

```bash
cd Backend && npm run build && npm run start
cd Frontend && npm run build && npm run preview
```

Em produção, hospede o frontend (`Frontend/dist`) e a API (`Backend`) separadamente; configure `FRONTEND_URL` no `.env` do Backend para CORS.

## Docker

Requisitos: [Docker](https://www.docker.com/) e Docker Compose v2.

Na raiz do projeto:

```bash
# Opcional: chave Gemini para marketing com IA
copy .env.docker.example .env

docker compose up --build
```

| Serviço    | URL |
|------------|-----|
| App (UI)   | http://localhost:8080 |
| API        | http://localhost:3000 |
| Swagger    | http://localhost:3000/api-docs |
| PostgreSQL | `localhost:5432` (usuário/senha: `postgres` / `postgres`, banco: `gestify`) |

O backend aguarda o PostgreSQL ficar saudável, cria as tabelas (TypeORM) e executa os seeds na primeira subida.

Parar e remover containers:

```bash
docker compose down
```

Remover também o volume do banco:

```bash
docker compose down -v
```
