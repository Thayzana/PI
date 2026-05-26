# Plano de Testes – Gestify (TDD First)

Este documento descreve a estrategia de testes automatizados do Gestify, alinhada a pratica de **TDD (Test-Driven Development)**. Os testes devem ser escritos antes da implementacao/refatoracao das funcionalidades, guiando o design de codigo e evitando regressao.

---

## 1. Stack de Testes e Configuracao

- **Runner / Framework**: `vitest`
  - Testes unitarios e de integracao para backend (`back/`) e frontend (`front/`).
- **Frontend (React)**:
  - `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` para testes de componentes, interacoes e acessibilidade.
- **Backend (API REST)**:
  - `supertest` para testes de integracao da API Express.
- **Scripts no package.json**:
  - `npm test` → `vitest run`
  - `npm run test:watch` → `vitest` (modo watch TDD)
  - `npm run test:ui` → `vitest --ui` (painel visual para feedback rápido)

Configuracoes adicionais recomendadas:
- Criar `vitest.config.ts` reutilizando a base do `tsconfig.json`.
- Para o frontend, apontar `test.environment` = `jsdom`.
- Para o backend, usar environment padrao `node` e, quando possivel, **mocks de banco** (ou database Docker isolado) para cenarios criticos.

---

## 2. Principios Gerais de TDD no Projeto

1. **Escrever o teste primeiro** (vermelho), com cenário crítico e claro.
2. Implementar o código mínimo para o teste passar (verde).
3. **Refatorar** o código e os testes, mantendo a bateria verde.
4. Para cada bug encontrado, escrever um teste que reproduza o erro antes da correção.
5. Rodar `npm test` em CI / pipeline e localmente antes de merges importantes.

Prioridade dos testes:
- Cenários que envolvem **dinheiro (precificacao)**, **estoque**, **pedidos do cliente final**, **seguranca/acesso** e **integracao com IA / marketing**.

---

## 3. Plano de Testes por Funcionalidade

### 3.1 Autenticacao e Login (frontend/lib + fluxo inicial)

**Modulos-alvo:**
- `front/src/lib/auth.ts`
- `front/src/pages/LoginPage.tsx`
- Fluxo de autenticacao em `front/src/App.tsx`

**Objetivo:** garantir que apenas usuarios autorizados entrem no painel e que o fluxo de login seja consistente.

**Casos de teste (TDD) – prioridade alta**

1. **Auth local – credenciais corretas liberam acesso**
   - Dado usuario e senha iguais a `ADMIN_USERNAME`/`ADMIN_PASSWORD`
   - Quando `login(username, password)` e chamado
   - Entao a função deve retornar `true` e setar `gestify_auth = "true"` no `localStorage`.

2. **Auth local – credenciais incorretas bloqueiam acesso**
   - Quando `login` e chamado com credenciais erradas
   - Entao deve retornar `false` e **nao** alterar o valor de `gestify_auth`.

3. **App shell – redireciona para Login quando nao autenticado**
   - Renderizar `App` com `isAuthenticated()` mockado retornando `false`
   - Esperar que a tela renderizada contenha o form de login (titulo da pagina de login).

4. **App shell – exibe painel apos sucesso de login**
   - Mockar `isAuthenticated()` retornando `true`
   - Verificar se um dos componentes principais (ex.: `Sidebar`, `Header`) e renderizado.

5. **LoginPage – feedback de erro**
   - Mock `login` retornando `false`
   - Simular preenchimento de usuario/senha e submit
   - Verificar se a mensagem de erro em portugues aparece.

6. **LoginPage – banner de cookies / LGPD**
   - Garantir que, sem `gestify_cookie_consent`, o banner e exibido.
   - Ao clicar em “ACEITAR”, salvar `gestify_cookie_consent = "accepted"` e ocultar o banner.

**Mocks recomendados:**
- `window.localStorage` (usando `vitest` + `jsdom`).
- Funcoes de `auth` quando necessario isolar UI.

---

### 3.2 Precificacao e Custos Invisiveis (backend + PricingPage)

**Modulos-alvo:**
- Endpoints de precificacao em `back/routes.ts` / `back/...` (cálculo de preco final).
- `front/src/pages/PricingPage.tsx`

**Objetivo:** garantir que o calculo de precos incorpore corretamente os custos de insumo + custos invisiveis (embalagem, delivery, energia, mao de obra, taxa de plataforma etc.).

**Casos de teste backend (TDD) – prioridade critica**

1. **Calculo basico de preco de venda**
   - Dado um produto com custo de insumo X
   - E custos invisiveis configurados (embalagem, delivery, energia, gas, mao de obra, taxa plataforma)
   - Quando a API de precificacao e chamada
   - Entao o preco final deve respeitar a formula definida (ex.: custo total * markup).

2. **Atualizacao de custos invisiveis via endpoint**
   - Quando `POST /api/invisible-costs` recebe novos valores
   - Entao esses valores sao persistidos (via TypeORM) e usados nos proximos calculos.

3. **Validacao de entrada**
   - Valores negativos ou nulos incompativeis devem resultar em HTTP 400 com mensagem clara.

**Casos de teste frontend (TDD) – prioridade alta**

4. **PricingPage – renderiza totais corretos**
   - Mockar resposta da API com produto e custos invisiveis
   - Verificar se o preco exibido na UI corresponde ao calculado no backend.

5. **PricingPage – atualiza preco ao alterar algum custo**
   - Simular alteracao de um dos campos de custo invisivel
   - Verificar se o total recalculado na tela muda.

**Mocks recomendados:**
- `supertest` para API usando banco em memoria/seed minimo.
- `fetch` no frontend (via `global.fetch = vi.fn()` ou wrapper customizado) para isolar a logica de calculo na UI.

---

### 3.3 Estoque (InventoryPage + backend)

**Objetivo:** garantir que o estoque reflita corretamente entradas, saídas, estoque minimo e alertas.

**Casos de teste backend – prioridade critica**

1. **Registro de entrada de estoque**
   - Dado um produto existente
   - Quando API de entrada e chamada (ex.: `POST /api/inventory/entries`)
   - Entao o saldo de estoque deve aumentar e ser persistido.

2. **Registro de saida de estoque**
   - Quando uma saida e registrada
   - Entao o saldo diminui; nao pode ficar negativo.

3. **Alerta de estoque minimo**
   - Dado um produto com `stock <= minimum`
   - Ao buscar lista de produtos
   - Entao o produto deve ser marcado (flag ou campo) para uso no badge de baixo estoque no `Sidebar`.

**Casos de teste frontend – prioridade alta**

4. **InventoryPage – exibe contagem de baixo estoque certa**
   - Mockar lista de produtos com diferentes `stock`/`minimum`
   - Verificar se o badge na `Sidebar` reflete a quantidade calculada.

5. **InventoryPage – previne envio de movimentacao invalida**
   - Simular submit com quantidade zero/negativa
   - Verificar validacao de UI e que nenhuma chamada de API e feita.

---

### 3.4 Fornecedores e Itens Fornecidos (SuppliersPage)

**Objetivo:** garantir integridade entre fornecedores e itens fornecidos.

**Casos de teste backend**

1. **Cadastro de fornecedor com itens**
   - `POST /api/suppliers` com lista de itens fornecidos
   - Deve persistir fornecedor e associacoes.

2. **Adicao de item a fornecedor existente**
   - `POST /api/suppliers/:id/items`
   - Nao deve duplicar itens ja vinculados, apenas acrescentar novos.

**Casos de teste frontend**

3. **SuppliersPage – exibe itens fornecidos corretamente**
   - Mockar fornecedor com varios itens
   - Verificar renderizacao da lista de itens.

4. **SuppliersPage – impede cadastro sem nome**
   - Validacao de form evitando submits vazios.

---

### 3.5 Promocoes + Marketing (IA com Gemini)

**Objetivo:** validar fluxo critico de promocao + integracao com o modulo de marketing/IA.

**Casos de teste backend**

1. **Endpoint de marketing – chamada bem sucedida**
   - Mockar cliente Gemini (`@google/genai`) para retornar texto fixo.
   - Ao chamar `/api/marketing/generate`
   - Deve responder com JSON contendo `generatedText`.

2. **Endpoint de marketing – ausencia de API key**
   - Quando `GEMINI_API_KEY` nao esta configurada
   - A API deve retornar erro de configuracao amigavel (ex.: 500 ou 400 com mensagem clara).

**Casos de teste frontend**

3. **MarketingPage – mostra aviso quando chave Gemini nao configurada**
   - Mockar `fetch("/api/settings/gemini-status")` retornando `{ configured: false }`
   - Verificar exibicao do banner de alerta.

4. **MarketingPage – gera texto de campanha com sucesso**
   - Mockar `fetch("/api/marketing/generate")` com response conhecido.
   - Simular clique em “Gerar Copywriter” e verificar texto exibido no painel.

5. **MarketingPage – parse robusto de JSON para flyer**
   - Mockar resposta de `/api/marketing/generate` com JSON mal-formatado
   - Garantir que a funcao de parsing use fallback sem quebrar a interface.

**Mocks recomendados:**
- Mock do modulo `@google/genai` com `vi.mock`.
- Mock de `fetch` no frontend.

---

### 3.6 Menu Publico / Simulador de Pedidos (cliente final)

**Objetivo:** garantir que o cliente final consiga visualizar catalogo e simular pedidos sem quebrar o fluxo interno.

**Casos de teste backend**

1. **Listagem de itens do cardapio publico**
   - Endpoint dedicado (ex.: `/api/menu`) deve filtrar apenas produtos publicaveis (ativos).

2. **Criacao de pedido a partir do menu**
   - Endpoint de criacao de pedido deve validar itens, estoque disponivel e dados minimos do cliente.

**Casos de teste frontend**

3. **PublicMenuSimulator – renderiza itens do cardapio**
   - Mockar API retornando lista de produtos
   - Verificar renderizacao dos cards com nome, preco e imagem.

4. **PublicMenuSimulator – calcula total do pedido**
   - Simular adicao de itens ao carrinho
   - Verificar se o total exibido corresponde ao somatorio.

5. **PublicMenuSimulator – impede confirmacao sem itens**
   - Simular clique em “finalizar” sem itens
   - Garantir exibicao de aviso e ausencia de chamada POST.

---

### 3.7 Configuracoes e Reset de Banco (SettingsPage)

**Objetivo:** garantir que acoes administrativas de alto impacto sejam validadas.

**Casos de teste backend**

1. **Reset de configuracoes de custos invisiveis**
   - Ao chamar endpoint de reset
   - Deve restaurar configuracoes padrao e disparar recarga de dados.

**Casos de teste frontend**

2. **SettingsPage – confirmacao de reset**
   - Simular clique no botao de reset com confirmacao
   - Verificar chamada de API e feedback visual (alerta ou toast).

---

## 4. Estrategia de Automatizacao e Regressao

- **Ponto unico de entrada**: `npm test` deve ser executavel em qualquer ambiente (dev, CI).
- **Divisao de suites** (opcional, via `describe` ou `vitest` CLI):
  - `backend/*` – testes Node/Express/TypeORM.
  - `frontend/*` – testes React/Tailwind.
- **Regressao**:
  - Qualquer bug detectado deve gerar um novo teste que falha antes da correção.
  - A matriz de testes deve ser mantida atualizada quando novas features forem adicionadas (especialmente novos modulos no `App.tsx`).
- **Mocks e isolamento**:
  - Mockar integracoes externas (Gemini, HTTP externos) para manter os testes rapidos e deterministas.
  - Para o banco, preferir fixtures pequenas/seeds especificos para cada suite.

---

## 5. Iteracao e Melhorias do Plano de Testes

### 5.1 Primeira analise

Na primeira versao do plano, o foco foi cobrir:
- Login/autenticacao.
- Precificacao e custos invisiveis.
- Estoque, fornecedores, promocoes/marketing, menu publico e configuracoes.

Pontos de melhoria identificados:
- Deixar explicito o uso de TDD no fluxo diario (testes em modo watch).
- Destacar criterios de prioridade (dinheiro, estoque, pedidos e integracoes externas).
- Sugerir divisao clara de suites backend/frontend para facilitar execucao em CI.

### 5.2 Ajustes aplicados nesta versao

- Adicionada sessao de **principios gerais de TDD** (Seção 2).
- Reforcado foco em cenarios criticos (precificacao, estoque, pedidos, IA).
- Definido uso de `npm run test:watch` como comando principal para TDD.
- Especificado uso de mocks para `localStorage`, `fetch` e `@google/genai`.

Esta versao do plano deve servir como referencia central para a criacao dos testes em `back/` e `front/` e para a configuracao de qualquer pipeline de CI que o projeto venha a utilizar.

