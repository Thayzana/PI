# Gestify

Sistema de gestão para confeitarias e comércio/varejo. Stack: **React + Vite** (frontend), **Node + Express + TypeORM** (backend) e **PostgreSQL** (banco de dados).

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [PostgreSQL](https://www.postgresql.org/) instalado e em execução (porta padrão `5432`)

## Estrutura do projeto

```
gestify/
├── front/          # Interface React (Vite)
├── back/           # API Express, entidades TypeORM, seeds, Swagger
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

### Documentação da API (Swagger)

Com o servidor rodando:

- **UI:** http://localhost:3000/api-docs
- **JSON OpenAPI:** http://localhost:3000/api-docs.json

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

## Login de administrador

O painel exige autenticação antes de exibir o dashboard:

| Campo | Valor |
|-------|--------|
| Usuário | `1164` |
| Senha | `19735` |

A sessão fica salva em `localStorage` até você clicar em **Sair** no menu lateral.

## Perfil do usuário

Nome, empresa, cargo, e-mail e foto podem ser editados em **Editar Perfil** (dropdown do cabeçalho ou em Configurações). Os dados são persistidos no navegador (`localStorage`).

## Upload de imagens de produtos

O campo `image_url` na tabela `products` deve ser **TEXT** (não `varchar(512)`), para aceitar Base64 longo.

**Migrar manualmente (PostgreSQL):**

```bash
npm run db:migrate
```

Ou execute o SQL em `back/database/migrations/001_alter_products_image_url_to_text.sql`:

```sql
ALTER TABLE products
  ALTER COLUMN image_url TYPE TEXT
  USING image_url::TEXT;
```

Reinicie o servidor (`npm run dev`) após a migração.

## Marketing com IA (Gemini)

Sem `GEMINI_API_KEY`, as rotas de marketing retornam erro. Configure a chave no `.env.local` ou em **Configurações → Chave Gemini** no app.

## Solução de problemas

| Erro | O que fazer |
|------|-------------|
| `autenticação do tipo senha falhou` | Confira usuário e senha em `DATABASE_URL` |
| `banco de dados "projetoFinal" não existe` | Execute `npm run db:create` |
| `GEMINI_API_KEY ausente` | Adicione a chave no `.env.local` ou nas Configurações |
| PostgreSQL não responde | Verifique se o serviço PostgreSQL está rodando |
| Marcadores `<<<<<<<` no código | Resolva conflitos de merge; não devem existir em arquivos `.ts` |

## Implantação em servidor novo

1. Instalar Node.js e PostgreSQL  
2. Clonar o repositório e rodar `npm install`  
3. Criar `.env.local` com `DATABASE_URL` e `GEMINI_API_KEY`  
4. `npm run db:create` → `npm run db:seed`  
5. `npm run build` → `npm run start`  

---

View your app in AI Studio: https://ai.studio/apps/805a9f64-9a8c-46f4-b0bd-ffa4386c8226
