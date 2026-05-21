import "./load-env.ts";
import { Router, Request, Response } from "express";
import {
  dbAll,
  dbRun,
  dbGet,
  initializeDatabase
} from "./db.js";
import {
  getAiClient,
  isGeminiConfigured,
  saveGeminiApiKey,
} from "./gemini.ts";
import {
  isVarejoTheme,
  VAREJO_PRODUCTS,
  getVarejoDashboard,
  VAREJO_PROMOTIONS,
  VAREJO_SUPPLIERS,
  VAREJO_ORDERS,
} from "./sector-data.ts";

const router = Router();

function getThemeParam(req: Request): string {
  const theme = req.query.theme;
  return typeof theme === "string" ? theme : "";
}

// Status e configuração da chave Gemini (desenvolvimento local)
router.get("/settings/gemini-status", (_req: Request, res: Response) => {
  res.json({ configured: isGeminiConfigured() });
});

router.post("/settings/gemini-key", (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ error: "Informe a chave da API Gemini." });
    }
    saveGeminiApiKey(apiKey);
    res.json({ success: true, configured: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Ensure database tables are created on startup
initializeDatabase().catch((err) => {
  console.error("Erro ao inicializar base de dados:", err);
});

// 1. GET Dashboard statistics & analysis
router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const theme = getThemeParam(req);
    if (isVarejoTheme(theme)) {
      return res.json(getVarejoDashboard());
    }

    // Collect stats from database
    const products = await dbAll(`SELECT * FROM products`);
    const salesChart = await dbAll(`SELECT * FROM sales_history`);
    const promotions = await dbAll(`SELECT * FROM promotions`);
    const invisibleCostsRows = await dbAll(`SELECT * FROM invisible_costs`);

    // Calculate low stock and near expiry
    const lowStockCount = products.filter(p => p.stock <= p.minimum).length;
    
    // Near expiry calculation (items expiring in next 7 days or already expired)
    const today = new Date();
    const nearExpiryCount = products.filter(p => {
      const expDate = new Date(p.expiration);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;

    // Hardcode some premium statistical variances to mirror high-fidelity screens
    const weeklyRevenue = 12490;
    const weeklyProfit = 5220;

    // Build the stats structure matching DashboardStats interface
    const stats = {
      weekly_revenue: weeklyRevenue,
      weekly_profit: weeklyProfit,
      low_stock_count: lowStockCount,
      near_expiry_count: nearExpiryCount,
      revenue_vs_last_week: 18.2, // +18,2%
      profit_vs_last_week: 12.6,   // +12,6%
      low_stock_vs_last_week: 2,   // +2 items
      near_expiry_vs_last_week: -3, // -3 days/items
      sales_chart: salesChart.map(s => ({
        day: s.day,
        revenue: s.revenue,
        profit: s.profit
      })),
      top_sold: [
        { id: 1, name: "Brigadeiro Gourmet", sales: 312 },
        { id: 2, name: "Bolo de Pote — Ninho", sales: 184 },
        { id: 3, name: "Trufa Belga 70%", sales: 158 },
        { id: 4, name: "Cheesecake Frutas Vermelhas", sales: 92 }
      ],
      inactive_products: [
        { name: "Cupcake Limão Siciliano", days_inactive: 21, stock: 4 },
        { name: "Macaron Pistache", days_inactive: 18, stock: 7 },
        { name: "Bolo Red Velvet (fatia)", days_inactive: 14, stock: 3 }
      ],
      monthly_totals: {
        gross_revenue: 48320,
        production_costs: 19110,
        invisible_costs: 4220,
        ifood_tax: 5798,
        net_profit: 19192,
        margin_ratio: 39.7
      }
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET API Products (Inventory)
router.get("/products", async (req: Request, res: Response) => {
  try {
    const theme = getThemeParam(req);
    if (isVarejoTheme(theme)) {
      return res.json([...VAREJO_PRODUCTS].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    }

    const products = await dbAll(`SELECT * FROM products ORDER BY id DESC`);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add new Product
router.post("/products", async (req: Request, res: Response) => {
  try {
    const {
      sku, name, stock, minimum, expiration, status,
      price, description, image_url, category, is_promo, promo_price,
      barcode, unit_type, wholesale_price,
    } = req.body;
    if (!sku || !name || stock === undefined || minimum === undefined || !expiration) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }

    const result = await dbRun(
      `INSERT INTO products (sku, name, stock, minimum, expiration, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sku,
        name,
        Number(stock),
        Number(minimum),
        expiration,
        status || "OK",
        price !== undefined ? Number(price) : undefined,
        description || "",
        image_url || "",
        category || "Docinhos",
        is_promo ? 1 : 0,
        promo_price !== undefined ? Number(promo_price) : undefined,
        barcode || "",
        unit_type || "Unidade",
        wholesale_price !== undefined && wholesale_price !== null ? Number(wholesale_price) : undefined,
      ]
    );

    const newProduct = await dbGet(`SELECT * FROM products WHERE id = ?`, [result.lastID]);
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Product
router.put("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      sku, name, stock, minimum, expiration, status,
      price, description, image_url, category, is_promo, promo_price,
      barcode, unit_type, wholesale_price,
    } = req.body;

    await dbRun(
      `UPDATE products SET sku = ?, name = ?, stock = ?, minimum = ?, expiration = ?, status = ? WHERE id = ?`,
      [
        sku,
        name,
        Number(stock),
        Number(minimum),
        expiration,
        status,
        id,
        price !== undefined ? Number(price) : undefined,
        description || "",
        image_url || "",
        category || "Docinhos",
        is_promo ? 1 : 0,
        promo_price !== undefined ? Number(promo_price) : undefined,
        barcode || "",
        unit_type || "Unidade",
        wholesale_price !== undefined && wholesale_price !== null ? Number(wholesale_price) : undefined,
      ]
    );

    const updated = await dbGet(`SELECT * FROM products WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Product
router.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM products WHERE id = ?`, [id]);
    res.json({ success: true, message: `Produto id ${id} removido com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET / POST Smart Pricing Recipes
router.get("/recipes", async (req: Request, res: Response) => {
  try {
    const recipes = await dbAll(`SELECT * FROM recipes ORDER BY id DESC`);
    
    // Attach ingredients to each recipe
    const hydratedRecipes = [];
    for (const r of recipes) {
      const ingredients = await dbAll(`SELECT * FROM recipe_ingredients WHERE recipe_id = ?`, [r.id]);
      hydratedRecipes.push({
        ...r,
        ingredients
      });
    }
    
    res.json(hydratedRecipes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save Recipe (Insert or Update if matching name)
router.post("/recipes", async (req: Request, res: Response) => {
  try {
    const { id, name, yield: yieldCount, margin_ratio, final_price, unit_cost, invisible_costs, subtotal, ingredients } = req.body;
    
    if (!name || !yieldCount || margin_ratio === undefined || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Configuração de receita inválida ou campos incompletos." });
    }

    let recipeId = id;

    if (recipeId) {
      // Update existing
      await dbRun(
        `UPDATE recipes SET name = ?, yield = ?, margin_ratio = ?, final_price = ?, unit_cost = ?, invisible_costs = ?, subtotal = ? WHERE id = ?`,
        [name, Number(yieldCount), Number(margin_ratio), Number(final_price), Number(unit_cost), Number(invisible_costs), Number(subtotal), recipeId]
      );
      // Clear associated ingredients to re-insert clean
      await dbRun(`DELETE FROM recipe_ingredients WHERE recipe_id = ?`, [recipeId]);
    } else {
      // Create new
      const result = await dbRun(
        `INSERT INTO recipes (name, yield, margin_ratio, final_price, unit_cost, invisible_costs, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, Number(yieldCount), Number(margin_ratio), Number(final_price), Number(unit_cost), Number(invisible_costs), Number(subtotal)]
      );
      recipeId = result.lastID;
    }

    // Insert ingredients
    for (const ing of ingredients) {
      await dbRun(
        `INSERT INTO recipe_ingredients (recipe_id, name, amount, unit, price) VALUES (?, ?, ?, ?, ?)`,
        [recipeId, ing.name, Number(ing.amount), ing.unit, Number(ing.price)]
      );
    }

    // Hydrate updated response
    const savedRecipe = await dbGet(`SELECT * FROM recipes WHERE id = ?`, [recipeId]);
    const savedIngs = await dbAll(`SELECT * FROM recipe_ingredients WHERE recipe_id = ?`, [recipeId]);

    res.status(201).json({
      ...savedRecipe,
      ingredients: savedIngs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Recipe
router.delete("/recipes/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM recipes WHERE id = ?`, [id]);
    await dbRun(`DELETE FROM recipe_ingredients WHERE recipe_id = ?`, [id]);
    res.json({ success: true, message: `Receita id ${id} removida com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. GET / POST Invisible Costs overhead
router.get("/invisible-costs", async (req: Request, res: Response) => {
  try {
    const rows = await dbAll(`SELECT * FROM invisible_costs`);
    const dict: any = {};
    rows.forEach(r => {
      dict[r.key] = r.value;
    });
    res.json(dict);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/invisible-costs", async (req: Request, res: Response) => {
  try {
    const costs = req.body;
    for (const key of Object.keys(costs)) {
      await dbRun(
        `INSERT INTO invisible_costs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, Number(costs[key])]
      );
    }
    res.json({ success: true, updated: costs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET / POST Promotions
router.get("/promotions", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json(VAREJO_PROMOTIONS);
    }

    const promos = await dbAll(`SELECT * FROM promotions`);
    res.json(promos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Apply or activate promotion
router.post("/promotions/:id/apply", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body; // 1 or 0
    await dbRun(`UPDATE promotions SET active = ? WHERE id = ?`, [active ? 1 : 0, id]);
    const updated = await dbGet(`SELECT * FROM promotions WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create promotion manually
router.post("/promotions", async (req: Request, res: Response) => {
  try {
    const { title, subtitle, type, discount, recovery, status } = req.body;
    const result = await dbRun(
      `INSERT INTO promotions (title, subtitle, type, discount, recovery, status, active) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [title, subtitle, type, discount, Number(recovery || 0), status || "Normal"]
    );
    const newPromo = await dbGet(`SELECT * FROM promotions WHERE id = ?`, [result.lastID]);
    res.json(newPromo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Gemini powered copy generator for Confeitaria Marketing (IA Marketing Tab)
router.post("/marketing/generate", async (req: Request, res: Response) => {
  try {
    const { context, type } = req.body; // e.g. "Brigadeiro gourmet — promoção do dia dos namorados" and "caption" | "hashtags" | "calendar"
    if (!context) {
      return res.status(400).json({ error: "Descreva o produto ou ocasião do marketing." });
    }

    let prompt = "";
    if (type === "caption") {
      prompt = `Você é um especialista em marketing gastronômico para confeitarias premium. Escreva uma legenda irresistível de Instagram para o seguinte produto ou ocasião culinária: "${context}". Use quebras de linha amigáveis, emojis de doces/confeitaria, e gatilhos mentais que deem água na boca no público brasileiro.`;
    } else if (type === "hashtags") {
      prompt = `Crie uma lista com as 15 hashtags mais relevantes e de alta conversão no Instagram para impulsionar e atrair clientes de confeitaria fina com foco em: "${context}".`;
    } else if (type === "seasonal") {
      prompt = `Como um consultor de marketing criativo de confeitarias, crie um roteiro de ideias criativas de posts de Instagram para o produto ou ocasião: "${context}". Dê ideias focadas em datas comemorativas nacionais ou sazonais para divulgar essa novidade. Retorne como tópicos scannables enriquecidos em português.`;
    } else if (type === "flyer") {
      prompt = `Crie textos de divulgação irresistíveis para um flyer/post quadrado de redes sociais sobre o produto ou situação: "${context}". Dê a sua resposta exclusivamente no formato JSON abaixo, sem blocos de código markdown adicionais (NÃO use \`\`\`json ou semelhantes, responda puramente com um objeto JSON válido). Se não souber o preço do produto, invente uma sugestão realista de preço em Reais.
Formato do JSON de retorno:
{
  "headline": "Uma frase de impacto curta em maiúsculas (Ex: SÓ HOJE, NOVIDADE IRRESISTÍVEL, PROMOÇÃO IMPEDÍVEL, QUENTINHO DO FORNO)",
  "productName": "Nome premium do produto culinário",
  "description": "Uma frase descritiva curta (máximo de 65 caracteres) que chame atenção e dê muita água na boca",
  "priceTag": "Preço formatado em Reais (Ex: R$ 18,50)",
  "cta": "Excelente chamada para ação (Ex: Peça já pelo WhatsApp!, Garanta o seu!)"
}`;
    } else {
      prompt = `Cria uma estratégia promocional de marketing completa para o produto ou situação de confeitaria: "${context}". Escreva uma copy de vendas irresistível com hashtags inclusas.`;
    }

    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um assistente especialista em marketing digital especializado em confeitarias, padarias e culinária doce brasileira. Seu tom é amigável, entusiasmado, persuasivo e focado em dar fome ou inspirar desejos irresistíveis."
      }
    });

    let generatedText = result.text || "Não foi possível gerar sugestões neste momento.";
    if (type === "flyer") {
      generatedText = generatedText.replace(/```json/gi, "").replace(/```/g, "").trim();
    }
    res.json({ generatedText });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET / POST / PUT / DELETE Suppliers
router.get("/suppliers", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json(VAREJO_SUPPLIERS);
    }

    const suppliers = await dbAll(`SELECT * FROM suppliers ORDER BY id DESC`);
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/suppliers", async (req: Request, res: Response) => {
  try {
    const { name, contact, category, active, items } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const itemsJson = Array.isArray(items) ? JSON.stringify(items) : "[]";

    const result = await dbRun(
      `INSERT INTO suppliers (name, contact, category, active, items) VALUES (?, ?, ?, ?, ?)`,
      [name, contact || "", category || "", active !== undefined ? Number(active) : 1, itemsJson]
    );

    const newSupplier = await dbGet(`SELECT * FROM suppliers WHERE id = ?`, [result.lastID]);
    res.status(201).json(newSupplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/suppliers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contact, category, active, items } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const itemsJson = Array.isArray(items) ? JSON.stringify(items) : "[]";

    await dbRun(
      `UPDATE suppliers SET name = ?, contact = ?, category = ?, active = ?, items = ? WHERE id = ?`,
      [name, contact || "", category || "", active !== undefined ? Number(active) : 1, itemsJson, id]
    );

    const updated = await dbGet(`SELECT * FROM suppliers WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/suppliers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM suppliers WHERE id = ?`, [id]);
    res.json({ success: true, message: `Fornecedor id ${id} removido com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === PEDIDOS E LOGÍSTICA DE ENTREGA (DELIVERY INTELIGENTE) ===

// List all orders (including products in parsed JSON formats)
router.get("/orders", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json([...VAREJO_ORDERS].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    }

    const list = await dbAll("SELECT * FROM orders ORDER BY id DESC");
    // Parse items from string to JSON array if they were saved as a string
    const parsedList = list.map(order => {
      let parsedItems = [];
      if (typeof order.items === "string") {
        try {
          parsedItems = JSON.parse(order.items);
        } catch {
          parsedItems = [];
        }
      } else {
        parsedItems = order.items || [];
      }
      return {
        ...order,
        items: parsedItems
      };
    });
    res.json(parsedList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const {
      customer_name,
      customer_phone,
      type,
      status,
      items,
      total_value,
      delivery_fee,
      cep,
      rua,
      bairro,
      cidade,
      estado,
      numero,
      complemento,
      estimated_time,
      driver_name,
      driver_type,
      driver_phone,
      transport_obs,
      created_at
    } = req.body;

    if (!customer_name || !type) {
      return res.status(400).json({ error: "Nome do cliente e tipo de pedido são obrigatórios" });
    }

    const itemsJson = Array.isArray(items) ? JSON.stringify(items) : "[]";

    const result = await dbRun(
      `INSERT INTO orders (customer_name, customer_phone, type, status, items, total_value, delivery_fee, cep, rua, bairro, cidade, estado, numero, complemento, estimated_time, driver_name, driver_type, driver_phone, transport_obs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        customer_phone || "",
        type,
        status || "Em preparo",
        itemsJson,
        Number(total_value) || 0,
        Number(delivery_fee) || 0,
        cep || "",
        rua || "",
        bairro || "",
        cidade || "",
        estado || "",
        numero || "",
        complemento || "",
        estimated_time || "40-50 min",
        driver_name || "",
        driver_type || "Próprio",
        driver_phone || "",
        transport_obs || "",
        created_at || new Date().toISOString()
      ]
    );

    const newOrder = await dbGet("SELECT * FROM orders WHERE id = ?", [result.lastID]);
    if (newOrder) {
      if (typeof newOrder.items === "string") {
        try {
          newOrder.items = JSON.parse(newOrder.items);
        } catch {
          newOrder.items = [];
        }
      }
    }
    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status only
router.put("/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }

    await dbRun("UPDATE orders SET status = ? WHERE id = ?", [status, Number(id)]);
    const updated = await dbGet("SELECT * FROM orders WHERE id = ?", [Number(id)]);
    if (updated && typeof updated.items === "string") {
      try {
        updated.items = JSON.parse(updated.items);
      } catch {
        updated.items = [];
      }
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update entire order
router.put("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      customer_phone,
      type,
      status,
      items,
      total_value,
      delivery_fee,
      cep,
      rua,
      bairro,
      cidade,
      estado,
      numero,
      complemento,
      estimated_time,
      driver_name,
      driver_type,
      driver_phone,
      transport_obs
    } = req.body;

    const itemsJson = Array.isArray(items) ? JSON.stringify(items) : "[]";

    await dbRun(
      `UPDATE orders SET customer_name = ?, customer_phone = ?, type = ?, status = ?, items = ?, total_value = ?, delivery_fee = ?, cep = ?, rua = ?, bairro = ?, cidade = ?, estado = ?, numero = ?, complemento = ?, estimated_time = ?, driver_name = ?, driver_type = ?, driver_phone = ?, transport_obs = ? WHERE id = ?`,
      [
        customer_name,
        customer_phone || "",
        type,
        status,
        itemsJson,
        Number(total_value) || 0,
        Number(delivery_fee) || 0,
        cep || "",
        rua || "",
        bairro || "",
        cidade || "",
        estado || "",
        numero || "",
        complemento || "",
        estimated_time || "",
        driver_name || "",
        driver_type || "Próprio",
        driver_phone || "",
        transport_obs || "",
        Number(id)
      ]
    );

    const updated = await dbGet("SELECT * FROM orders WHERE id = ?", [Number(id)]);
    if (updated && typeof updated.items === "string") {
      try {
        updated.items = JSON.parse(updated.items);
      } catch {
        updated.items = [];
      }
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
router.delete("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbRun("DELETE FROM orders WHERE id = ?", [Number(id)]);
    res.json({ success: true, message: `Pedido ${id} removido com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
