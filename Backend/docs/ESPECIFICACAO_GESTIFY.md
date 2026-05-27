# ESPECIFICACAO DO CONTEXTO ADAPTADO (ARQUITETURA DO PROJETO GESTIFY)

## 1. Usuarios e Casos de Uso

### Perfis de usuario

- **Gestor / Administrador (Painel Gestify)**
  - Acessa o painel web administrativo.
  - Define o tema/segmento (confeitaria, varejo, delivery etc.).
  - Gerencia produtos, receitas, estoque, fornecedores, promocoes, logistica de entrega, cardapio digital e configuracoes gerais.
  - Tem acesso a area de marketing (IA) e relatorios consolidados.

- **Operador / Atendente de Loja (usuario interno)**
  - Compartilha o mesmo painel, focado em rotinas operacionais.
  - Atualiza estoque (entradas/saidas), registra pedidos, imprime etiquetas e acompanha promocoes.
  - Nao altera configuracoes estruturais (ex.: chaves de API, reset de banco).

- **Cliente Final (Cardapio / Catalogo Publico)**
  - Acessa o cardapio digital publico (menu publico).
  - Visualiza itens, precos, promocoes e pode simular ou registrar pedidos em fluxo simplificado.
  - Nao tem acesso ao painel interno nem a dados de gestao.

### Matriz de casos de uso e escopo de dados

- **Gestor / Administrador**
  - Dashboard operacional (visao geral de vendas, produtos e indicadores).
  - Precificacao (CRUD de produtos/receitas, custos visiveis e custos invisiveis).
  - Estoque (entradas/saidas, estoque minimo, alertas de ruptura e validade).
  - Fornecedores (cadastro e relacionamento de itens).
  - Etiquetas (geracao para gondola, lote e validade).
  - Promocoes e Marketing (combos, campanhas e IA para copy/arte).
  - Delivery e Logistica (pedidos, retirada, entrega e despacho).
  - Cardapio/Catalogo Digital (publicacao e sincronizacao).
  - Configuracoes (tema, chave Gemini e manutencao do ambiente).

- **Operador / Atendente**
  - Registra pedidos e atualiza status operacional.
  - Da baixa em estoque durante o atendimento.
  - Gera etiquetas conforme necessidade de exposicao/expedicao.

- **Cliente Final**
  - Usa o modulo publico para visualizar produtos e promocoes.
  - Simula/abre pedidos que entram no fluxo interno de operacao.

## 2. Arquitetura e Plataforma Tecnologica

- **Padrao de Arquitetura**
  - Arquitetura monolitica em camadas em monorepo (`gestify/`).
  - Backend em Node.js + Express + TypeORM, expondo API REST.
  - Frontend em React 19 + Vite, consumindo API via HTTP (fetch).
  - Em desenvolvimento, o servidor roda na porta `3000` com Vite em middleware.

- **Backend**
  - Runtime: Node.js com `tsx`.
  - Framework: Express.
  - Persistencia: PostgreSQL via TypeORM.
  - Responsabilidades:
    - Inicializacao de banco e seeds.
    - Exposicao de rotas REST dos modulos de negocio.
    - Regras de precificacao/custos e agregacao de indicadores.
    - Integracao com Gemini para marketing.

- **Frontend**
  - Biblioteca: React 19 (SPA).
  - Bundler: Vite (root em `Frontend`).
  - Estilos: Tailwind CSS v4 + tokens de tema em `Frontend/src/index.css`.
  - Estado: hooks padrao (`useState`, `useEffect`).
  - Paginas principais:
    - `LoginPage`
    - `DashboardPage`
    - `PricingPage`
    - `InventoryPage`
    - `SuppliersPage`
    - `LabelPage`
    - `PromotionsPage`
    - `MarketingPage`
    - `DeliveryLogisticsPage`
    - `MenuAdminPage`
    - `PublicMenuSimulator`
    - `SettingsPage`

- **Banco de Dados**
  - PostgreSQL configurado por `DATABASE_URL`.
  - Entidades voltadas para produtos, receitas, estoque, fornecedores, promocoes e pedidos.

- **Infraestrutura e Ferramentas**
  - Scripts principais:
    - `npm run dev`
    - `npm run build`
    - `npm run start`
    - `npm run db:create`
    - `npm run db:seed`
  - Build:
    - Frontend: Vite
    - Backend: esbuild (`dist/server.cjs`)

- **Autenticacao e Seguranca**
  - No MVP atual, autenticacao simplificada via `localStorage`.
  - Controle de sessao pelo modulo `Frontend/src/lib/auth.ts`.
  - Rotas internas protegidas no frontend por estado de autenticacao em `App.tsx`.

## 3. Estrutura de Diretorios do Projeto

```text
gestify/
├── Backend/
│   ├── database/
│   ├── seeds/
│   ├── routes.ts
│   ├── gemini.ts
│   └── server.ts
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── index.css
│   │   ├── App.tsx
│   │   └── main.tsx
├── dist/
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4. Convencoes e Configuracoes de Ambiente

### Padroes de codigo

- Linguagem: TypeScript (frontend e backend).
- Nomenclatura:
  - `camelCase` para funcoes/variaveis.
  - `PascalCase` para componentes e tipos.
  - `UPPER_SNAKE_CASE` para constantes e chaves de sistema.

### Mapeamento de variaveis de ambiente

- **Backend (raiz do projeto)**
  - `DATABASE_URL`:
    - Exemplo: `postgresql://postgres:SUA_SENHA@localhost:5432/gestify`
  - `GEMINI_API_KEY`:
    - Chave da API Gemini para o modulo de marketing.
  - `APP_URL`:
    - URL publica da aplicacao (quando aplicavel em cloud/deploy).

- **Frontend**
  - Consumo da API por caminhos relativos (`/api/...`) no ambiente atual.
  - Opcionalmente, pode ser adotado `VITE_API_URL` em deploy desacoplado.

## 5. Modulos Tecnicos-Chave

- **Backend**
  - `Backend/server.ts`: bootstrap do servidor, middlewares, swagger e inicializacao de banco.
  - `Backend/database/init.ts`: conexao e setup do PostgreSQL.
  - `Backend/routes.ts`: endpoints REST da aplicacao.
  - `Backend/gemini.ts`: integracao com Gemini.

- **Frontend**
  - `Frontend/src/App.tsx`: roteamento interno por abas, tema e autenticacao.
  - `Frontend/src/pages/LoginPage.tsx`: tela de login dinamica (fundo alternado, card transluzido e banner de cookies).
  - `Frontend/src/pages/MarketingPage.tsx`: geracao de copys e artes com IA.
  - `Frontend/src/lib/auth.ts`: autenticacao local e persistencia de sessao.

