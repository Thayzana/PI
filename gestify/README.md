<<<<<<< HEAD
# Gestify

Sistema de gestão para confeitarias e comércio/varejo. Stack: **React + Vite** (frontend), **Node + Express + TypeORM** (backend) e **PostgreSQL** (banco de dados).

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [PostgreSQL](https://www.postgresql.org/) instalado e em execução (porta padrão `5432`)

## Estrutura do projeto

```
gestify/
├── front/          # Interface React (Vite)
├── back/           # API Express, entidades TypeORM, seeds
├── .env.example    # Modelo de variáveis de ambiente
└── .env.local      # Suas credenciais (não versionado)
```

## Configuração inicial

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Copie o exemplo e edite com seus dados:

```bash
copy .env.example .env.local
```

No Windows (PowerShell), use `Copy-Item .env.example .env.local` se preferir.

Arquivo `.env.local` na raiz do projeto:

```env
# PostgreSQL — usuário, senha e nome do banco
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/projetoFinal"

# Gemini — marketing com IA (opcional, mas recomendado)
GEMINI_API_KEY="sua-chave-gemini-aqui"
```

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL. Ex.: `postgresql://postgres:senha@localhost:5432/projetoFinal` |
| `GEMINI_API_KEY` | Chave da API Gemini para textos de marketing. Obtenha em [Google AI Studio](https://aistudio.google.com/apikey) |

Também é possível salvar a chave Gemini em **Configurações** dentro do app (desenvolvimento local).

### 3. Banco de dados PostgreSQL

**Criar o banco** (apenas na primeira vez, se `projetoFinal` ainda não existir):

```bash
npm run db:create
```

**Popular dados iniciais** (produtos, receitas, promoções, fornecedores, pedidos de exemplo):

```bash
npm run db:seed
```

Os seeds são **idempotentes**: só inserem registros quando as tabelas estão vazias. Em nova implantação, rode `db:create` e `db:seed` (ou apenas suba o app — veja abaixo).

Ao iniciar com `npm run dev`, o servidor conecta ao PostgreSQL, sincroniza as tabelas (TypeORM) e verifica os seeds automaticamente.

## Como usar

### Desenvolvimento

```bash
npm run dev
```

Abra no navegador: **http://localhost:3000**

O comando sobe o Express na porta `3000` e o Vite em modo middleware (hot reload no frontend).

### Produção

```bash
npm run build
npm run start
```

O build gera o frontend em `dist/` e o servidor em `dist/server.cjs`.

### Outros comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor + frontend em desenvolvimento |
| `npm run build` | Build de produção (Vite + esbuild) |
| `npm run start` | Servidor de produção |
| `npm run db:create` | Cria o banco definido em `DATABASE_URL` |
| `npm run db:seed` | Executa seeds nas tabelas vazias |
| `npm run lint` | Verificação TypeScript (`tsc --noEmit`) |
| `npm run clean` | Remove a pasta `dist/` |

## API e temas

A API fica em `/api/*`. Exemplos:

- `GET /api/dashboard`
- `GET /api/products`
- `GET /api/orders`

**Tema confeitaria (padrão):** dados vêm do PostgreSQL.

**Tema Comércio & Varejo:** o frontend envia `?theme=varejo` nas requisições; nesse modo, listagens e dashboard usam dados mock em `back/sector-data.ts` (sem alterar o banco).

## Marketing com IA (Gemini)

Sem `GEMINI_API_KEY`, as rotas de marketing retornam erro. Configure a chave no `.env.local` ou em **Configurações → Chave Gemini** no app.

## Solução de problemas

| Erro | O que fazer |
|------|-------------|
| `autenticação do tipo senha falhou` | Confira usuário e senha em `DATABASE_URL` |
| `banco de dados "projetoFinal" não existe` | Execute `npm run db:create` |
| `GEMINI_API_KEY ausente` | Adicione a chave no `.env.local` ou nas Configurações |
| PostgreSQL não responde | Verifique se o serviço PostgreSQL está rodando |

## Implantação em servidor novo

1. Instalar Node.js e PostgreSQL  
2. Clonar o repositório e rodar `npm install`  
3. Criar `.env.local` com `DATABASE_URL` e `GEMINI_API_KEY`  
4. `npm run db:create` → `npm run db:seed`  
5. `npm run build` → `npm run start`  

---
=======

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
>>>>>>> d3f5fe8c5731f1b4280a0862b7a50dcc2fb6d33d
