# Documento de Especificação de Requisitos — Gestify

Este documento descreve os **Requisitos Funcionais (RF)** e **Requisitos Não Funcionais (RNF)** do **Gestify**, um sistema de gestão e precificação inteligente integrado a inteligência artificial generativa, adaptado tanto para o setor de confeitarias e alimentação quanto para o comércio e varejo em geral.

---

## 1. Visão Geral do Sistema

O **Gestify** é uma aplicação web modular projetada para auxiliar pequenos e médios negócios na gestão diária de suas operações. O sistema consolida funções de controle de estoque, cálculo de custos (insumos e custos invisíveis), geração de receitas/fórmulas, simulação de cardápio digital, roteirização de entregas, promoções inteligentes e suporte a marketing com IA (através do Google Gemini API).

O grande diferencial do sistema é sua **capacidade adaptativa** (multitema/multissetor), ajustando termos, terminologias, cores e dashboards automaticamente de acordo com o segmento configurado (ex: Confeitaria, Cafeteria, Hamburgueria, Doceria, Delivery ou Varejo Geral).

---

## 2. Atores do Sistema

O sistema conta com três perfis de usuários principais:

*   **Gestor / Administrador (Painel Interno):** Possui acesso irrestrito ao painel administrativo. Pode alterar chaves de API, resetar dados, alterar perfis e temas, gerenciar custos invisíveis globais, precificar receitas e supervisionar o financeiro.
*   **Operador / Atendente (Painel Interno):** Acessa o mesmo painel com privilégios reduzidos. Executa rotinas do dia a dia como controle de entradas/saídas do estoque, alteração de status de pedidos (despacho/entrega) e impressão de etiquetas. Não altera chaves de API ou resets do sistema.
*   **Cliente Final (Interface Pública):** Visualiza a vitrine digital/cardápio de forma autônoma, consulta produtos ativos, promoções vigentes e simula pedidos (carrinho de compras).

---

## 3. Requisitos Funcionais (RF)

Os requisitos funcionais estão agrupados pelos módulos e páginas da plataforma:

### RF01 — Autenticação e Gestão de Acesso
*   **RF01.1 — Login Interno:** O sistema deve exigir autenticação (usuário e senha) para dar acesso aos painéis internos de gestão (Administrador/Operador).
*   **RF01.2 — Persistência de Sessão:** A sessão de autenticação deve ser salva localmente (ex: via token/estado persistido em `localStorage`) para evitar re-login constante do operador durante o turno.
*   **RF01.3 — Consentimento de LGPD:** O sistema deve exibir um banner de consentimento de cookies da LGPD no primeiro acesso, persistindo a aceitação do usuário antes de ocultá-lo.
*   **RF01.4 — Logout do Sistema:** O usuário deve ser capaz de encerrar sua sessão a qualquer momento, limpando os dados de autenticação e sendo redirecionado para a tela de login.

### RF02 — Gestão Adaptativa de Temas (Setores)
*   **RF02.1 — Alteração Dinâmica de Tema:** O sistema deve permitir ao usuário alternar a interface entre temas predefinidos (ex: *Confeitaria*, *Cafeteria*, *Hamburgueria*, *Doceria*, *Delivery Rápido* ou *Comércio e Varejo*).
*   **RF02.2 — Adaptação Semântica da Terminologia:** Toda a nomenclatura de navegação e as descrições da interface devem ser traduzidas conforme o setor. (Ex: "Ingredientes/Receitas" em confeitaria tornam-se "Produtos/Itens" no varejo).
*   **RF02.3 — Cores e Identidade Visual Contextuais:** O tema de cores (variáveis CSS de marca, hover, background de sidebar, etc.) deve se reconfigurar dinamicamente ao selecionar o setor correspondente.

### RF03 — Painel de Controle (Dashboard)
*   **RF03.1 — Resumo Financeiro:** Exibir o total de vendas do dia/mês, ticket médio, lucro estimado e margem média atual.
*   **RF03.2 — Indicadores Operacionais:** Apresentar gráficos ou estatísticas consolidadas de vendas diárias e novos pedidos recebidos.
*   **RF03.3 — Status de Estoque Crítico:** Alertar na tela inicial a quantidade de itens que estão abaixo do estoque mínimo definido.
*   **RF03.4 — Alertas Sanitários/Validade:** Notificar produtos com datas de validade expiradas ou próximas do vencimento.

### RF04 — Precificação Inteligente e Fórmulas (Pricing)
*   **RF04.1 — Cadastro de Receitas / Composições:** Permitir a criação de receitas associando ingredientes cadastrados no estoque, definindo suas respectivas quantidades.
*   **RF04.2 — Cálculo de Custo Unitário de Insumos:** Calcular automaticamente a soma dos custos de todos os insumos da receita com base na proporção utilizada.
*   **RF04.3 — Rateio de Custos Invisíveis:** Incorporar taxas e custos indiretos (embalagem, custo de entrega estimado, energia elétrica, gás de cozinha, mão de obra e comissões de plataformas como iFood) no cálculo do custo do produto.
*   **RF04.4 — Margem de Lucro e Markup:** Permitir a definição de uma margem/markup desejado sobre o custo total para calcular automaticamente o preço de venda sugerido.
*   **RF04.5 — Preço Final de Venda:** Exibir o preço final sugerido e permitir a gravação do valor para sincronização com o produto final no catálogo.

### RF05 — Controle de Estoque (Inventory)
*   **RF05.1 — Cadastro de Produtos:** Permitir o cadastro de produtos informando SKU, nome, preço, quantidade em estoque, estoque mínimo de segurança, validade do lote, unidade de medida, código de barras (EAN), preço de atacado e categoria.
*   **RF05.2 — Movimentação de Estoque:** Registrar entradas e saídas manuais de mercadorias atualizando o saldo disponível de forma imediata.
*   **RF05.3 — Bloqueio de Estoque Negativo:** Impedir saídas de estoque que façam o saldo disponível ficar negativo, a menos que configurado o contrário.
*   **RF05.4 — Controle de Lotes e Validade:** Armazenar e alertar o gestor sobre lotes que estão prestes a vencer para evitar desperdício de insumos.
*   **RF05.5 — Badge de Alerta:** Exibir de forma persistente um badge na barra de navegação principal indicando o número de itens com estoque crítico.

### RF06 — Gestão de Fornecedores (Suppliers)
*   **RF06.1 — Cadastro de Fornecedores:** Cadastrar empresas fornecedoras registrando Nome, Contato, Categoria e Status (Ativo/Inativo).
*   **RF06.2 — Associação de Itens:** Vincular quais insumos ou produtos do estoque são fornecidos por cada distribuidor.
*   **RF06.3 — Busca e Filtro de Contatos:** Permitir pesquisar fornecedores por nome ou categoria de suprimentos fornecidos.

### RF07 — Gerador de Etiquetas
*   **RF07.1 — Impressão de Etiquetas de Gôndola:** Gerar etiquetas formatadas contendo Nome do Produto, Código de Barras (EAN), Preço de Venda, Lote e Data de Validade.
*   **RF07.2 — Geração de QR Code Sanitário:** Gerar automaticamente um QR Code para rastreamento sanitário que redirecione para as informações de lote, validade e informações de fabricação do produto.
*   **RF07.3 — Exportação em PDF:** Permitir o download de folhas de etiquetas estruturadas em formato PDF prontas para impressão térmica ou convencional.

### RF08 — Promoções e Combos Inteligentes
*   **RF08.1 — Configuração de Promoções:** Permitir o cadastro de promoções informando título, desconto percentual e recuperação esperada.
*   **RF08.2 — Sugestão Automática de Combos:** O sistema deve analisar produtos com alto volume de estoque e sugerir a criação de combos promocionais para escoar os itens.
*   **RF08.3 — Ativação/Desativação de Promoções:** O gestor deve ser capaz de ativar ou desativar uma promoção com apenas um clique, aplicando instantaneamente as alterações no preço dos itens no cardápio público.

### RF09 — Módulo de Marketing com IA (Google Gemini)
*   **RF09.1 — Legendas Persuasivas para Redes Sociais:** Gerar legendas de posts no Instagram/Facebook personalizadas com base no produto ou ocasião inserida pelo usuário, utilizando gatilhos mentais gastronômicos ou de venda.
*   **RF09.2 — Geração de Hashtags Relevantes:** Fornecer uma lista de hashtags de alto engajamento adaptadas ao produto descrito.
*   **RF09.3 — Calendário Promocional Sazonal:** Sugerir cronogramas de postagem e ideias de conteúdo temático focado em datas comemorativas nacionais.
*   **RF09.4 — Geração de Conteúdo para Flyers (JSON Parse):** Gerar dados estruturados para exibição de panfletos virtuais (Headline, Nome do Produto, Descrição Curta, Preço Recomendado e Chamada para Ação/CTA) permitindo visualização direta na interface.

### RF10 — Gestão de Pedidos, Entrega e Logística
*   **RF10.1 — Cadastro de Pedidos (Interno/Externo):** Registrar novos pedidos informando dados do cliente, itens comprados, quantidades, preço final e tipo de entrega (Retirada ou Delivery).
*   **RF10.2 — Controle de Status do Pedido:** Permitir o avanço do fluxo de pedidos por meio de status operacionais claros (ex: *Pendente*, *Em Preparo*, *Despachado*, *Entregue*, *Cancelado*).
*   **RF10.3 — Cálculo e Roteirização Simplificada:** Oferecer sugestões de tempo de despacho ou agrupamento de entregas baseadas no CEP ou zona de entrega informada.
*   **RF10.4 — Ficha de Despacho:** Exibir uma via para expedição que possa ser anexada à embalagem do produto com os dados de envio.

### RF11 — Cardápio / Catálogo Público do Cliente Final
*   **RF11.1 — Visualização de Produtos Ativos:** Apresentar uma vitrine responsiva com fotos, títulos, descrições e preços de produtos que estejam marcados como ativos no painel interno.
*   **RF11.2 — Filtros de Categoria:** Permitir que o cliente filtre os produtos por suas categorias específicas.
*   **RF11.3 — Carrinho e Simulação de Compra:** O cliente deve poder adicionar produtos ao carrinho, alterar quantidades, ver a somatória dos preços e simular a finalização do pedido.
*   **RF11.4 — Canalização para WhatsApp/Painel:** O pedido gerado pelo simulador público deve ser formatado para envio direto ao WhatsApp do estabelecimento ou registrado para processamento na aba de pedidos do operador.

### RF12 — Configurações e Manutenção do Sistema
*   **RF12.1 — Perfil da Loja:** Permitir que o gestor configure informações cadastrais da loja (nome fantasia, contato de telefone/WhatsApp, endereço, segmento).
*   **RF12.2 — Configuração da API Gemini:** Permitir o cadastro e validação da chave de API do Google Gemini (`GEMINI_API_KEY`) diretamente na tela de configurações administrativas para habilitar os recursos de IA.
*   **RF12.3 — Restauração de Padrões (Reset):** Fornecer uma opção administrativa para limpar o banco de dados e restaurar os valores padrão de custos invisíveis do sistema.

---

## 4. Requisitos Não Funcionais (RNF)

Os requisitos não funcionais determinam restrições de qualidade, infraestrutura, arquitetura e segurança do sistema:

### RNF01 — Desempenho e Escalabilidade
*   **RNF01.1 — Tempo de Resposta da API:** As requisições REST internas (consultas a produtos, receitas e fornecedores) devem responder em menos de 500 milissegundos sob condições normais de rede.
*   **RNF01.2 — Latência da IA:** A comunicação com o serviço de IA da Google Gemini deve possuir tratamento visual de carregamento (*skeletons/spinners*) para não impactar a percepção de performance da aplicação durante a geração de textos.
*   **RNF01.3 — Renderização de SPA:** O frontend deve funcionar como uma Single Page Application (SPA), garantindo transições de abas instantâneas sem a necessidade de recarregar a página inteira no navegador.

### RNF02 — Usabilidade e Interface (UX/UI)
*   **RNF02.1 — Design Responsivo:** A interface do sistema deve ser totalmente adaptável (responsiva), permitindo a operação confortável tanto em desktops da loja quanto em tablets de atendentes ou smartphones de clientes finais.
*   **RNF02.2 — Acessibilidade de Contraste:** O esquema de cores de cada tema dinâmico deve manter taxas de contraste que atendam aos requisitos de leitura confortáveis.
*   **RNF02.3 — Micro-animações e Feedback Visual:** Utilizar transições suaves em hovers, botões ativos, e alteração de abas para enriquecer a experiência de uso.

### RNF03 — Segurança e Privacidade
*   **RNF03.1 — Criptografia de Credenciais de IA:** A chave de API do Gemini inserida pelo usuário deve ser enviada via requisição segura e mantida sob variáveis de ambiente no servidor ou protegida contra exposição indevida no console público do navegador.
*   **RNF03.2 — Controle de Níveis de Acesso:** O sistema deve validar no backend se o usuário possui papel operacional ou administrativo para impedir chamadas de escrita a endpoints críticos (como reset de banco).
*   **RNF03.3 — Conformidade com LGPD:** Os cookies utilizados pelo sistema devem ser estritamente necessários para o funcionamento e persistência de preferências de sessão do usuário, respeitando a escolha efetuada no banner de privacidade.

### RNF04 — Confiabilidade e Robustez
*   **RNF04.1 — Fallbacks em Integrações Externas:** Se a API do Gemini falhar por falta de conectividade, limite de taxa (rate limiting) ou chave incorreta, o frontend deve exibir um alerta informativo amigável e permitir que o usuário utilize recursos manuais sem travar a interface.
*   **RNF04.2 — Integridade Referencial no Banco:** O banco de dados (PostgreSQL/TypeORM) deve manter restrições de chave estrangeira que impeçam a deleção de insumos que estejam vinculados a receitas ou movimentações de estoque existentes, exibindo aviso instrutivo ao operador.
*   **RNF04.3 — Cobertura de Testes Unitários:** Mecanismos cruciais de cálculo de preço (markup/custos) devem possuir cobertura por testes automatizados executados pelo Vitest, garantindo previsibilidade de comportamento.

### RNF05 — Arquitetura e Portabilidade
*   **RNF05.1 — Arquitetura de Monorepo Organizada:** O código do backend (Node.js + Express) e frontend (React + Vite) deve ficar separado em diretórios dedicados (`Backend/` e `Frontend/`), simplificando o processo de build e de implantação em provedores de nuvem distintos.
*   **RNF05.2 — Independência de Banco de Dados por ORM:** O uso do TypeORM como camada de persistência deve abstrair o banco de dados, facilitando a portabilidade e permitindo alternar de PostgreSQL para outro banco compatível (como SQLite ou MySQL) com pouca ou nenhuma alteração no código-fonte.
*   **RNF05.3 — Padronização de Estilos:** Utilização do Tailwind CSS v4 com customização de tokens de design centralizados no arquivo de estilos principal (`index.css`), evitando duplicações e estilos inline.

---
