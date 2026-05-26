import swaggerJsdoc from "swagger-jsdoc";

const themeQueryParam = {
  name: "theme",
  in: "query" as const,
  description:
    "Setor da aplicação. Use `varejo` para dados de demonstração do comércio/varejo; omita ou use outro valor para confeitaria (PostgreSQL).",
  schema: { type: "string", enum: ["confeitaria", "varejo"], example: "confeitaria" },
};

const errorResponse = {
  description: "Erro interno ou validação",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Gestify API — Confeitaria Studio",
      version: "1.0.0",
      description:
        "API REST do Gestify para gestão de confeitaria e varejo: estoque, receitas, precificação, promoções, fornecedores, pedidos e marketing com IA (Gemini).",
      contact: {
        name: "Gestify",
      },
    },
    servers: [
      { url: "/api", description: "Servidor local (prefixo /api)" },
    ],
    tags: [
      { name: "Configurações", description: "Chave Gemini e status da IA" },
      { name: "Dashboard", description: "Indicadores e análises" },
      { name: "Produtos", description: "Estoque e catálogo" },
      { name: "Receitas", description: "Precificação inteligente" },
      { name: "Custos invisíveis", description: "Overhead de produção" },
      { name: "Promoções", description: "Campanhas e descontos" },
      { name: "Marketing", description: "Geração de copy com Gemini" },
      { name: "Fornecedores", description: "Cadastro de fornecedores" },
      { name: "Pedidos", description: "Pedidos e logística de entrega" },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
        SuccessMessage: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
          },
        },
        GeminiStatus: {
          type: "object",
          properties: { configured: { type: "boolean" } },
        },
        GeminiKeyRequest: {
          type: "object",
          required: ["apiKey"],
          properties: { apiKey: { type: "string", description: "Chave da API Google Gemini" } },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "integer" },
            sku: { type: "string" },
            name: { type: "string" },
            stock: { type: "number" },
            minimum: { type: "number" },
            expiration: { type: "string", format: "date" },
            status: { type: "string", enum: ["OK", "Baixo", "Vencendo"] },
            price: { type: "number" },
            description: { type: "string" },
            image_url: { type: "string" },
            category: { type: "string" },
            is_promo: { type: "boolean" },
            promo_price: { type: "number" },
            barcode: { type: "string" },
            unit_type: { type: "string" },
            wholesale_price: { type: "number" },
          },
        },
        ProductInput: {
          type: "object",
          required: ["sku", "name", "stock", "minimum", "expiration"],
          properties: {
            sku: { type: "string" },
            name: { type: "string" },
            stock: { type: "number" },
            minimum: { type: "number" },
            expiration: { type: "string" },
            status: { type: "string", default: "OK" },
            price: { type: "number" },
            description: { type: "string" },
            image_url: { type: "string" },
            category: { type: "string" },
            is_promo: { type: "boolean" },
            promo_price: { type: "number" },
            barcode: { type: "string" },
            unit_type: { type: "string" },
            wholesale_price: { type: "number" },
          },
        },
        RecipeIngredient: {
          type: "object",
          properties: {
            id: { type: "integer" },
            recipe_id: { type: "integer" },
            name: { type: "string" },
            amount: { type: "number" },
            unit: { type: "string" },
            price: { type: "number" },
          },
        },
        Recipe: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            yield: { type: "number" },
            margin_ratio: { type: "number" },
            final_price: { type: "number" },
            unit_cost: { type: "number" },
            invisible_costs: { type: "number" },
            subtotal: { type: "number" },
            ingredients: {
              type: "array",
              items: { $ref: "#/components/schemas/RecipeIngredient" },
            },
          },
        },
        RecipeInput: {
          type: "object",
          required: ["name", "yield", "margin_ratio", "ingredients"],
          properties: {
            id: { type: "integer", description: "Se informado, atualiza a receita existente" },
            name: { type: "string" },
            yield: { type: "number" },
            margin_ratio: { type: "number" },
            final_price: { type: "number" },
            unit_cost: { type: "number" },
            invisible_costs: { type: "number" },
            subtotal: { type: "number" },
            ingredients: {
              type: "array",
              items: { $ref: "#/components/schemas/RecipeIngredient" },
            },
          },
        },
        InvisibleCosts: {
          type: "object",
          additionalProperties: { type: "number" },
          example: {
            packaging: 120,
            delivery: 80,
            energy: 45,
            gas: 30,
            labor: 200,
            ifood_ratio: 0.27,
          },
        },
        Promotion: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            subtitle: { type: "string" },
            type: { type: "string" },
            discount: { type: "string" },
            recovery: { type: "number" },
            status: { type: "string" },
            active: { type: "integer", enum: [0, 1] },
          },
        },
        PromotionInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            type: { type: "string" },
            discount: { type: "string" },
            recovery: { type: "number" },
            status: { type: "string" },
          },
        },
        MarketingGenerateRequest: {
          type: "object",
          required: ["context"],
          properties: {
            context: { type: "string", description: "Produto ou ocasião para o conteúdo" },
            type: {
              type: "string",
              enum: ["caption", "hashtags", "seasonal", "flyer"],
              description: "Tipo de conteúdo gerado pela IA",
            },
          },
        },
        MarketingGenerateResponse: {
          type: "object",
          properties: { generatedText: { type: "string" } },
        },
        Supplier: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            contact: { type: "string" },
            category: { type: "string" },
            active: { type: "integer" },
            items: { type: "array", items: { type: "string" } },
          },
        },
        SupplierInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            contact: { type: "string" },
            category: { type: "string" },
            active: { type: "integer" },
            items: { type: "array", items: { type: "string" } },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            quantity: { type: "number" },
            price: { type: "number" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "integer" },
            customer_name: { type: "string" },
            customer_phone: { type: "string" },
            type: { type: "string", enum: ["Balcão", "Delivery", "Encomenda Sazonal"] },
            status: {
              type: "string",
              enum: ["Em preparo", "Pronto para Entrega", "Rota de Envio", "Entregue"],
            },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            total_value: { type: "number" },
            delivery_fee: { type: "number" },
            cep: { type: "string" },
            rua: { type: "string" },
            bairro: { type: "string" },
            cidade: { type: "string" },
            estado: { type: "string" },
            numero: { type: "string" },
            complemento: { type: "string" },
            estimated_time: { type: "string" },
            driver_name: { type: "string" },
            driver_type: { type: "string" },
            driver_phone: { type: "string" },
            transport_obs: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        OrderInput: {
          type: "object",
          required: ["customer_name", "type"],
          properties: {
            customer_name: { type: "string" },
            customer_phone: { type: "string" },
            type: { type: "string" },
            status: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            total_value: { type: "number" },
            delivery_fee: { type: "number" },
            cep: { type: "string" },
            rua: { type: "string" },
            bairro: { type: "string" },
            cidade: { type: "string" },
            estado: { type: "string" },
            numero: { type: "string" },
            complemento: { type: "string" },
            estimated_time: { type: "string" },
            driver_name: { type: "string" },
            driver_type: { type: "string" },
            driver_phone: { type: "string" },
            transport_obs: { type: "string" },
            created_at: { type: "string" },
          },
        },
        DashboardStats: {
          type: "object",
          properties: {
            weekly_revenue: { type: "number" },
            weekly_profit: { type: "number" },
            low_stock_count: { type: "number" },
            near_expiry_count: { type: "number" },
            revenue_vs_last_week: { type: "number" },
            profit_vs_last_week: { type: "number" },
            low_stock_vs_last_week: { type: "number" },
            near_expiry_vs_last_week: { type: "number" },
            sales_chart: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  revenue: { type: "number" },
                  profit: { type: "number" },
                },
              },
            },
            top_sold: { type: "array", items: { type: "object" } },
            inactive_products: { type: "array", items: { type: "object" } },
            monthly_totals: { type: "object" },
          },
        },
      },
    },
    paths: {
      "/settings/gemini-status": {
        get: {
          tags: ["Configurações"],
          summary: "Verifica se a chave Gemini está configurada",
          responses: {
            "200": {
              description: "Status da configuração",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/GeminiStatus" },
                },
              },
            },
          },
        },
      },
      "/settings/gemini-key": {
        post: {
          tags: ["Configurações"],
          summary: "Salva a chave da API Gemini",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GeminiKeyRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Chave salva",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      configured: { type: "boolean" },
                    },
                  },
                },
              },
            },
            "400": errorResponse,
          },
        },
      },
      "/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "Estatísticas do dashboard",
          parameters: [themeQueryParam],
          responses: {
            "200": {
              description: "Métricas e gráficos",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DashboardStats" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/products": {
        get: {
          tags: ["Produtos"],
          summary: "Lista produtos do estoque",
          parameters: [themeQueryParam],
          responses: {
            "200": {
              description: "Lista de produtos",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Produtos"],
          summary: "Cadastra novo produto",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Produto criado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/products/{id}": {
        put: {
          tags: ["Produtos"],
          summary: "Atualiza produto",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Produto atualizado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Product" },
                },
              },
            },
            "500": errorResponse,
          },
        },
        delete: {
          tags: ["Produtos"],
          summary: "Remove produto",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            "200": {
              description: "Produto removido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/recipes": {
        get: {
          tags: ["Receitas"],
          summary: "Lista receitas com ingredientes",
          responses: {
            "200": {
              description: "Receitas",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Recipe" },
                  },
                },
              },
            },
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Receitas"],
          summary: "Cria ou atualiza receita",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecipeInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Receita salva",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Recipe" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/recipes/{id}": {
        delete: {
          tags: ["Receitas"],
          summary: "Remove receita",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            "200": {
              description: "Receita removida",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/invisible-costs": {
        get: {
          tags: ["Custos invisíveis"],
          summary: "Obtém custos invisíveis (objeto chave-valor)",
          responses: {
            "200": {
              description: "Custos",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InvisibleCosts" },
                },
              },
            },
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Custos invisíveis"],
          summary: "Atualiza custos invisíveis",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InvisibleCosts" },
              },
            },
          },
          responses: {
            "200": {
              description: "Custos atualizados",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      updated: { $ref: "#/components/schemas/InvisibleCosts" },
                    },
                  },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/promotions": {
        get: {
          tags: ["Promoções"],
          summary: "Lista promoções",
          parameters: [themeQueryParam],
          responses: {
            "200": {
              description: "Promoções",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Promotion" },
                  },
                },
              },
            },
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Promoções"],
          summary: "Cria promoção",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PromotionInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Promoção criada",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Promotion" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/promotions/{id}/apply": {
        post: {
          tags: ["Promoções"],
          summary: "Ativa ou desativa promoção",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { active: { type: "boolean" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Promoção atualizada",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Promotion" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/marketing/generate": {
        post: {
          tags: ["Marketing"],
          summary: "Gera conteúdo de marketing com Gemini",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MarketingGenerateRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Texto gerado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MarketingGenerateResponse" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/suppliers": {
        get: {
          tags: ["Fornecedores"],
          summary: "Lista fornecedores",
          parameters: [themeQueryParam],
          responses: {
            "200": {
              description: "Fornecedores",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Supplier" },
                  },
                },
              },
            },
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Fornecedores"],
          summary: "Cadastra fornecedor",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SupplierInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Fornecedor criado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Supplier" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/suppliers/{id}": {
        put: {
          tags: ["Fornecedores"],
          summary: "Atualiza fornecedor",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SupplierInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Fornecedor atualizado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Supplier" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
        delete: {
          tags: ["Fornecedores"],
          summary: "Remove fornecedor",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            "200": {
              description: "Fornecedor removido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/orders": {
        get: {
          tags: ["Pedidos"],
          summary: "Lista pedidos",
          parameters: [themeQueryParam],
          responses: {
            "200": {
              description: "Pedidos",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Order" },
                  },
                },
              },
            },
            "500": errorResponse,
          },
        },
        post: {
          tags: ["Pedidos"],
          summary: "Cria pedido",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderInput" },
              },
            },
          },
          responses: {
            "201": {
              description: "Pedido criado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Order" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
      "/orders/{id}": {
        put: {
          tags: ["Pedidos"],
          summary: "Atualiza pedido completo",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderInput" },
              },
            },
          },
          responses: {
            "200": {
              description: "Pedido atualizado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Order" },
                },
              },
            },
            "500": errorResponse,
          },
        },
        delete: {
          tags: ["Pedidos"],
          summary: "Remove pedido",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          responses: {
            "200": {
              description: "Pedido removido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessMessage" },
                },
              },
            },
            "500": errorResponse,
          },
        },
      },
      "/orders/{id}/status": {
        put: {
          tags: ["Pedidos"],
          summary: "Atualiza apenas o status do pedido",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Status atualizado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Order" },
                },
              },
            },
            "400": errorResponse,
            "500": errorResponse,
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
