/** Unidades de medida para Comércio e Varejo */
export type UnitType = "Unidade" | "Pacote" | "Fardo" | "Kg" | "Litro";

export const UNIT_TYPE_OPTIONS: UnitType[] = [
  "Unidade",
  "Pacote",
  "Fardo",
  "Kg",
  "Litro",
];

export interface Product {
  id?: number;
  sku: string;
  name: string;
  stock: number;
  minimum: number;
  expiration: string;
  status: 'OK' | 'Baixo' | 'Vencendo';
  price?: number;
  description?: string;
  image_url?: string;
  category?: string;
  is_promo?: boolean;
  promo_price?: number;
  /** Código de barras EAN (varejo) */
  barcode?: string;
  /** Tipo de unidade de venda/estoque */
  unit_type?: UnitType;
  /** Preço de atacado opcional (varejo) */
  wholesale_price?: number;
}

export function isRetailSector(themeId: string): boolean {
  return themeId === "varejo";
}

/** Migra id legado "comercio" → "varejo" */
export function normalizeThemeId(themeId: string | null): string {
  if (!themeId) return "confeitaria";
  if (themeId === "comercio") return "varejo";
  return themeId;
}

export interface RecipeIngredient {
  id?: number;
  recipe_id?: number;
  name: string;
  amount: number;
  unit: string;
  price: number; // original price paid for full pack (or raw value)
}

export interface Recipe {
  id?: number;
  name: string;
  yield: number;
  margin_ratio: number;
  final_price: number;
  unit_cost: number;
  invisible_costs: number;
  subtotal: number;
  ingredients: RecipeIngredient[];
}

export interface InvisibleCosts {
  packaging: number;
  delivery: number;
  energy: number;
  gas: number;
  labor: number;
  ifood_ratio: number;
}

export type InsightSeverity = "info" | "warning" | "success" | "critical";

export interface InsightItem {
  id: string;
  type: string;
  severity: InsightSeverity;
  message: string;
  metric?: string;
}

export interface ActionCard {
  id: string;
  category: "stock" | "promo" | "pricing" | "supplier";
  title: string;
  description: string;
  action: "open_suppliers" | "open_marketing" | "open_promotions" | "apply_price";
  payload?: Record<string, unknown>;
}

export interface NutritionalFacts {
  servingSize: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  fiber: string;
  sodium: string;
  saturatedFat?: string;
}

export interface DashboardStats {
  weekly_revenue: number;
  weekly_profit: number;
  low_stock_count: number;
  near_expiry_count: number;
  revenue_vs_last_week: number; // positive/negative change percentage
  profit_vs_last_week: number;
  low_stock_vs_last_week: number;
  near_expiry_vs_last_week: number;
  sales_chart: { day: string; revenue: number; profit: number }[];
  top_sold: { id: number; name: string; sales: number }[];
  inactive_products: { name: string; days_inactive: number; stock: number }[];
  monthly_totals: {
    gross_revenue: number;
    production_costs: number;
    invisible_costs: number;
    ifood_tax: number;
    net_profit: number;
    margin_ratio: number;
  };
}

export interface Promotion {
  id: number;
  title: string;
  subtitle: string;
  type: string;
  discount: string;
  recovery: number;
  status: string;
  active: number;
}

export interface LabelParams {
  productName: string;
  weight: string;
  lotName: string;
  fabDate: string;
  valDate: string;
}

export interface AppTheme {
  id: string;
  name: string;
  icon: string;
  brand: string;
  brandHover: string;
  brandBg: string;
  surfacePage: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  sidebarHoverBg: string;
}

export interface Supplier {
  id?: number;
  name: string;
  contact: string;
  category: string;
  active: number;
  items: string[];
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: number;
  customer_name: string;
  customer_phone: string;
  type: 'Balcão' | 'Delivery' | 'Encomenda Sazonal';
  status: 'Em preparo' | 'Pronto para Entrega' | 'Rota de Envio' | 'Entregue';
  items: OrderItem[];
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
  driver_type: 'Próprio' | 'Terceirizado';
  driver_phone: string;
  transport_obs: string;
  created_at?: string;
}

