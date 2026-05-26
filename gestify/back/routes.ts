import "./load-env.ts";
import { Router, Request, Response } from "express";
import * as repo from "./repositories/gestify.repository.ts";
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

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json(getVarejoDashboard());
    }
    const stats = await repo.getDashboardData();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/products", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json([...VAREJO_PRODUCTS].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    }
    res.json(await repo.findAllProducts());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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
    const newProduct = await repo.createProduct({
      sku, name,
      stock: Number(stock),
      minimum: Number(minimum),
      expiration,
      status,
      price: price !== undefined ? Number(price) : undefined,
      description,
      image_url,
      category,
      is_promo,
      promo_price: promo_price !== undefined ? Number(promo_price) : undefined,
      barcode,
      unit_type,
      wholesale_price:
        wholesale_price !== undefined && wholesale_price !== null
          ? Number(wholesale_price)
          : undefined,
    });
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      sku, name, stock, minimum, expiration, status,
      price, description, image_url, category, is_promo, promo_price,
      barcode, unit_type, wholesale_price,
    } = req.body;
    const updated = await repo.updateProduct(Number(id), {
      sku, name,
      stock: Number(stock),
      minimum: Number(minimum),
      expiration,
      status,
      price: price !== undefined ? Number(price) : undefined,
      description: description || "",
      image_url: image_url || "",
      category: category || "Docinhos",
      is_promo: !!is_promo,
      promo_price: promo_price !== undefined ? Number(promo_price) : undefined,
      barcode: barcode || "",
      unit_type: unit_type || "Unidade",
      wholesale_price:
        wholesale_price !== undefined && wholesale_price !== null
          ? Number(wholesale_price)
          : undefined,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await repo.deleteProduct(Number(id));
    res.json({ success: true, message: `Produto id ${id} removido com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/recipes", async (_req: Request, res: Response) => {
  try {
    res.json(await repo.findAllRecipesHydrated());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/recipes", async (req: Request, res: Response) => {
  try {
    const {
      id, name, yield: yieldCount, margin_ratio, final_price,
      unit_cost, invisible_costs, subtotal, ingredients,
    } = req.body;

    if (!name || !yieldCount || margin_ratio === undefined || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Configuração de receita inválida ou campos incompletos." });
    }

    const saved = await repo.saveRecipe({
      id,
      name,
      yield: Number(yieldCount),
      margin_ratio: Number(margin_ratio),
      final_price: Number(final_price),
      unit_cost: Number(unit_cost),
      invisible_costs: Number(invisible_costs),
      subtotal: Number(subtotal),
      ingredients,
    });
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/recipes/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await repo.deleteRecipe(Number(id));
    res.json({ success: true, message: `Receita id ${id} removida com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/invisible-costs", async (_req: Request, res: Response) => {
  try {
    res.json(await repo.getInvisibleCostsDict());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/invisible-costs", async (req: Request, res: Response) => {
  try {
    const costs = req.body;
    await repo.upsertInvisibleCosts(costs);
    res.json({ success: true, updated: costs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/promotions", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json(VAREJO_PROMOTIONS);
    }
    res.json(await repo.findAllPromotions());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/promotions/:id/apply", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const updated = await repo.setPromotionActive(Number(id), !!active);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/promotions", async (req: Request, res: Response) => {
  try {
    const { title, subtitle, type, discount, recovery, status } = req.body;
    const newPromo = await repo.createPromotion({
      title, subtitle, type, discount,
      recovery: Number(recovery || 0),
      status: status || "Normal",
    });
    res.json(newPromo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/marketing/generate", async (req: Request, res: Response) => {
  try {
    const { context, type } = req.body;
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
        systemInstruction:
          "Você é um assistente especialista em marketing digital especializado em confeitarias, padarias e culinária doce brasileira. Seu tom é amigável, entusiasmado, persuasivo e focado em dar fome ou inspirar desejos irresistíveis.",
      },
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

router.get("/suppliers", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json(VAREJO_SUPPLIERS);
    }
    res.json(await repo.findAllSuppliers());
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
    const newSupplier = await repo.createSupplier({
      name, contact, category, active, items,
    });
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
    const updated = await repo.updateSupplier(Number(id), {
      name, contact, category, active, items,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/suppliers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await repo.deleteSupplier(Number(id));
    res.json({ success: true, message: `Fornecedor id ${id} removido com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/orders", async (req: Request, res: Response) => {
  try {
    if (isVarejoTheme(getThemeParam(req))) {
      return res.json([...VAREJO_ORDERS].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    }
    res.json(await repo.findAllOrders());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/orders", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.customer_name || !body.type) {
      return res.status(400).json({ error: "Nome do cliente e tipo de pedido são obrigatórios" });
    }
    const newOrder = await repo.createOrder(body);
    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }
    const updated = await repo.updateOrderStatus(Number(id), status);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await repo.updateOrder(Number(id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await repo.deleteOrder(Number(id));
    res.json({ success: true, message: `Pedido ${id} removido com sucesso` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
