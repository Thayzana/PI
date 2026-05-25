import { AppDataSource } from "../database/data-source.ts";
import { Product } from "../entities/Product.ts";
import { Recipe } from "../entities/Recipe.ts";
import { RecipeIngredient } from "../entities/RecipeIngredient.ts";
import { InvisibleCost } from "../entities/InvisibleCost.ts";
import { SalesHistory } from "../entities/SalesHistory.ts";
import { Promotion } from "../entities/Promotion.ts";
import { Supplier } from "../entities/Supplier.ts";
import { Order, type OrderItemJson } from "../entities/Order.ts";
import {
  productToPlain,
  recipeToPlain,
  ingredientToPlain,
  promotionToPlain,
  orderToPlain,
  salesToPlain,
  invisibleCostsToDict,
} from "../database/serializers.ts";

// —— Produtos ——

export async function findAllProducts() {
  const rows = await AppDataSource.getRepository(Product).find({
    order: { id: "DESC" },
  });
  return rows.map((r) => productToPlain(r as unknown as Record<string, unknown>));
}

export async function findAllProductsRaw() {
  return AppDataSource.getRepository(Product).find();
}

export async function findProductById(id: number) {
  const row = await AppDataSource.getRepository(Product).findOneBy({ id });
  return row
    ? productToPlain(row as unknown as Record<string, unknown>)
    : undefined;
}

export async function createProduct(data: {
  sku: string;
  name: string;
  stock: number;
  minimum: number;
  expiration: string;
  status?: string;
  price?: number;
  description?: string;
  image_url?: string;
  category?: string;
  is_promo?: boolean;
  promo_price?: number;
  barcode?: string;
  unit_type?: string;
  wholesale_price?: number;
}) {
  const repo = AppDataSource.getRepository(Product);
  const entity = repo.create({
    sku: data.sku,
    name: data.name,
    stock: data.stock,
    minimum: data.minimum,
    expiration: data.expiration,
    status: data.status || "OK",
    price: data.price,
    description: data.description || "",
    image_url: data.image_url || "",
    category: data.category || "Docinhos",
    is_promo: !!data.is_promo,
    promo_price: data.promo_price,
    barcode: data.barcode || "",
    unit_type: data.unit_type || "Unidade",
    wholesale_price: data.wholesale_price,
  });
  const saved = await repo.save(entity);
  return productToPlain(saved as unknown as Record<string, unknown>);
}

export async function updateProduct(
  id: number,
  data: Partial<{
    sku: string;
    name: string;
    stock: number;
    minimum: number;
    expiration: string;
    status: string;
    price: number;
    description: string;
    image_url: string;
    category: string;
    is_promo: boolean;
    promo_price: number;
    barcode: string;
    unit_type: string;
    wholesale_price: number;
  }>
) {
  const repo = AppDataSource.getRepository(Product);
  await repo.update(id, {
    sku: data.sku,
    name: data.name,
    stock: data.stock,
    minimum: data.minimum,
    expiration: data.expiration,
    status: data.status,
    price: data.price,
    description: data.description,
    image_url: data.image_url,
    category: data.category,
    is_promo: data.is_promo,
    promo_price: data.promo_price,
    barcode: data.barcode,
    unit_type: data.unit_type,
    wholesale_price: data.wholesale_price,
  });
  return findProductById(id);
}

export async function deleteProduct(id: number) {
  await AppDataSource.getRepository(Product).delete(id);
}

// —— Receitas ——

export async function findAllRecipesHydrated() {
  const recipes = await AppDataSource.getRepository(Recipe).find({
    order: { id: "DESC" },
    relations: ["ingredients"],
  });
  return recipes.map((r) => {
    const plain = recipeToPlain(r as unknown as Record<string, unknown>);
    const ings = (r.ingredients || []).map((i) =>
      ingredientToPlain(i as unknown as Record<string, unknown>)
    );
    return { ...plain, ingredients: ings };
  });
}

export async function saveRecipe(data: {
  id?: number;
  name: string;
  yield: number;
  margin_ratio: number;
  final_price: number;
  unit_cost: number;
  invisible_costs: number;
  subtotal: number;
  ingredients: { name: string; amount: number; unit: string; price: number }[];
}) {
  const recipeRepo = AppDataSource.getRepository(Recipe);
  const ingRepo = AppDataSource.getRepository(RecipeIngredient);

  let recipeId = data.id;

  if (recipeId) {
    await recipeRepo.update(recipeId, {
      name: data.name,
      yield: data.yield,
      margin_ratio: data.margin_ratio,
      final_price: data.final_price,
      unit_cost: data.unit_cost,
      invisible_costs: data.invisible_costs,
      subtotal: data.subtotal,
    });
    await ingRepo.delete({ recipe_id: recipeId });
  } else {
    const created = await recipeRepo.save(
      recipeRepo.create({
        name: data.name,
        yield: data.yield,
        margin_ratio: data.margin_ratio,
        final_price: data.final_price,
        unit_cost: data.unit_cost,
        invisible_costs: data.invisible_costs,
        subtotal: data.subtotal,
      })
    );
    recipeId = created.id;
  }

  for (const ing of data.ingredients) {
    await ingRepo.save(
      ingRepo.create({
        recipe_id: recipeId!,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        price: ing.price,
      })
    );
  }

  const saved = await recipeRepo.findOne({
    where: { id: recipeId },
    relations: ["ingredients"],
  });
  if (!saved) throw new Error("Receita não encontrada após salvar");
  const plain = recipeToPlain(saved as unknown as Record<string, unknown>);
  const ings = (saved.ingredients || []).map((i) =>
    ingredientToPlain(i as unknown as Record<string, unknown>)
  );
  return { ...plain, ingredients: ings };
}

export async function deleteRecipe(id: number) {
  await AppDataSource.getRepository(RecipeIngredient).delete({ recipe_id: id });
  await AppDataSource.getRepository(Recipe).delete(id);
}

// —— Custos invisíveis ——

export async function getInvisibleCostsDict() {
  const rows = await AppDataSource.getRepository(InvisibleCost).find();
  return invisibleCostsToDict(rows);
}

export async function upsertInvisibleCosts(costs: Record<string, number>) {
  const repo = AppDataSource.getRepository(InvisibleCost);
  for (const key of Object.keys(costs)) {
    const existing = await repo.findOneBy({ key });
    if (existing) {
      existing.value = Number(costs[key]);
      await repo.save(existing);
    } else {
      await repo.save(repo.create({ key, value: Number(costs[key]) }));
    }
  }
}

// —— Dashboard ——

export async function getDashboardData() {
  const products = await findAllProductsRaw();
  const salesChart = await AppDataSource.getRepository(SalesHistory).find();
  const today = new Date();

  const lowStockCount = products.filter((p) => p.stock <= p.minimum).length;
  const nearExpiryCount = products.filter((p) => {
    const expDate = new Date(p.expiration);
    const diffDays = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7;
  }).length;

  return {
    weekly_revenue: 12490,
    weekly_profit: 5220,
    low_stock_count: lowStockCount,
    near_expiry_count: nearExpiryCount,
    revenue_vs_last_week: 18.2,
    profit_vs_last_week: 12.6,
    low_stock_vs_last_week: 2,
    near_expiry_vs_last_week: -3,
    sales_chart: salesChart.map((s) =>
      salesToPlain(s as unknown as Record<string, unknown>)
    ),
    top_sold: [
      { id: 1, name: "Brigadeiro Gourmet", sales: 312 },
      { id: 2, name: "Bolo de Pote — Ninho", sales: 184 },
      { id: 3, name: "Trufa Belga 70%", sales: 158 },
      { id: 4, name: "Cheesecake Frutas Vermelhas", sales: 92 },
    ],
    inactive_products: [
      { name: "Cupcake Limão Siciliano", days_inactive: 21, stock: 4 },
      { name: "Macaron Pistache", days_inactive: 18, stock: 7 },
      { name: "Bolo Red Velvet (fatia)", days_inactive: 14, stock: 3 },
    ],
    monthly_totals: {
      gross_revenue: 48320,
      production_costs: 19110,
      invisible_costs: 4220,
      ifood_tax: 5798,
      net_profit: 19192,
      margin_ratio: 39.7,
    },
  };
}

// —— Promoções ——

export async function findAllPromotions() {
  const rows = await AppDataSource.getRepository(Promotion).find();
  return rows.map((r) =>
    promotionToPlain(r as unknown as Record<string, unknown>)
  );
}

export async function findPromotionById(id: number) {
  const row = await AppDataSource.getRepository(Promotion).findOneBy({ id });
  return row
    ? promotionToPlain(row as unknown as Record<string, unknown>)
    : undefined;
}

export async function setPromotionActive(id: number, active: boolean) {
  await AppDataSource.getRepository(Promotion).update(id, {
    active: active ? 1 : 0,
  });
  return findPromotionById(id);
}

export async function createPromotion(data: {
  title: string;
  subtitle: string;
  type: string;
  discount: string;
  recovery?: number;
  status?: string;
}) {
  const repo = AppDataSource.getRepository(Promotion);
  const saved = await repo.save(
    repo.create({
      title: data.title,
      subtitle: data.subtitle,
      type: data.type,
      discount: data.discount,
      recovery: Number(data.recovery || 0),
      status: data.status || "Normal",
      active: 0,
    })
  );
  return promotionToPlain(saved as unknown as Record<string, unknown>);
}

// —— Fornecedores ——

export async function findAllSuppliers() {
  const rows = await AppDataSource.getRepository(Supplier).find({
    order: { id: "DESC" },
  });
  return rows;
}

export async function findSupplierById(id: number) {
  return AppDataSource.getRepository(Supplier).findOneBy({ id });
}

export async function createSupplier(data: {
  name: string;
  contact?: string;
  category?: string;
  active?: number;
  items?: string[];
}) {
  const repo = AppDataSource.getRepository(Supplier);
  const saved = await repo.save(
    repo.create({
      name: data.name,
      contact: data.contact || "",
      category: data.category || "",
      active: data.active !== undefined ? data.active : 1,
      items: Array.isArray(data.items) ? data.items : [],
    })
  );
  return saved;
}

export async function updateSupplier(
  id: number,
  data: {
    name: string;
    contact?: string;
    category?: string;
    active?: number;
    items?: string[];
  }
) {
  const repo = AppDataSource.getRepository(Supplier);
  await repo.update(id, {
    name: data.name,
    contact: data.contact || "",
    category: data.category || "",
    active: data.active !== undefined ? data.active : 1,
    items: Array.isArray(data.items) ? data.items : [],
  });
  return findSupplierById(id);
}

export async function deleteSupplier(id: number) {
  await AppDataSource.getRepository(Supplier).delete(id);
}

// —— Pedidos ——

export async function findAllOrders() {
  const rows = await AppDataSource.getRepository(Order).find({
    order: { id: "DESC" },
  });
  return rows.map((r) =>
    orderToPlain(r as unknown as Record<string, unknown>)
  );
}

export async function findOrderById(id: number) {
  const row = await AppDataSource.getRepository(Order).findOneBy({ id });
  return row
    ? orderToPlain(row as unknown as Record<string, unknown>)
    : undefined;
}

export async function createOrder(data: {
  customer_name: string;
  customer_phone?: string;
  type: string;
  status?: string;
  items?: OrderItemJson[];
  total_value?: number;
  delivery_fee?: number;
  cep?: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero?: string;
  complemento?: string;
  estimated_time?: string;
  driver_name?: string;
  driver_type?: string;
  driver_phone?: string;
  transport_obs?: string;
  created_at?: string;
}) {
  const repo = AppDataSource.getRepository(Order);
  const createdAt = data.created_at
    ? new Date(data.created_at)
    : new Date();
  const saved = await repo.save(
    repo.create({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone || "",
      type: data.type,
      status: data.status || "Em preparo",
      items: Array.isArray(data.items) ? data.items : [],
      total_value: Number(data.total_value) || 0,
      delivery_fee: Number(data.delivery_fee) || 0,
      cep: data.cep || "",
      rua: data.rua || "",
      bairro: data.bairro || "",
      cidade: data.cidade || "",
      estado: data.estado || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      estimated_time: data.estimated_time || "40-50 min",
      driver_name: data.driver_name || "",
      driver_type: data.driver_type || "Próprio",
      driver_phone: data.driver_phone || "",
      transport_obs: data.transport_obs || "",
      created_at: createdAt,
    })
  );
  return orderToPlain(saved as unknown as Record<string, unknown>);
}

export async function updateOrderStatus(id: number, status: string) {
  await AppDataSource.getRepository(Order).update(id, { status });
  return findOrderById(id);
}

export async function updateOrder(
  id: number,
  data: Partial<{
    customer_name: string;
    customer_phone: string;
    type: string;
    status: string;
    items: OrderItemJson[];
    total_value: number;
    delivery_fee: number;
    cep: string;
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    numero: string;
    complemento: string;
    estimated_time: string;
    driver_name: string;
    driver_type: string;
    driver_phone: string;
    transport_obs: string;
  }>
) {
  const repo = AppDataSource.getRepository(Order);
  await repo.update(id, {
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    type: data.type,
    status: data.status,
    items: Array.isArray(data.items) ? data.items : [],
    total_value: Number(data.total_value) || 0,
    delivery_fee: Number(data.delivery_fee) || 0,
    cep: data.cep,
    rua: data.rua,
    bairro: data.bairro,
    cidade: data.cidade,
    estado: data.estado,
    numero: data.numero,
    complemento: data.complemento,
    estimated_time: data.estimated_time,
    driver_name: data.driver_name,
    driver_type: data.driver_type,
    driver_phone: data.driver_phone,
    transport_obs: data.transport_obs,
  });
  return findOrderById(id);
}

export async function deleteOrder(id: number) {
  await AppDataSource.getRepository(Order).delete(id);
}
