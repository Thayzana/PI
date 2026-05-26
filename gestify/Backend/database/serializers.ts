/** Normaliza campos decimal do PostgreSQL para número na API JSON */

export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function productToPlain(p: Record<string, unknown>) {
  return {
    ...p,
    price: toNumber(p.price),
    promo_price: toNumber(p.promo_price),
    wholesale_price: toNumber(p.wholesale_price),
    is_promo: !!p.is_promo,
  };
}

export function recipeToPlain(r: Record<string, unknown>) {
  return {
    ...r,
    yield: r.yield != null ? Number(r.yield) : r.yield,
    margin_ratio: toNumber(r.margin_ratio),
    final_price: toNumber(r.final_price),
    unit_cost: toNumber(r.unit_cost),
    invisible_costs: toNumber(r.invisible_costs),
    subtotal: toNumber(r.subtotal),
  };
}

export function ingredientToPlain(i: Record<string, unknown>) {
  return {
    ...i,
    amount: toNumber(i.amount),
    price: toNumber(i.price),
  };
}

export function promotionToPlain(p: Record<string, unknown>) {
  return {
    ...p,
    recovery: toNumber(p.recovery),
    active: Number(p.active ?? 0),
  };
}

export function orderToPlain(o: Record<string, unknown>) {
  let items = o.items;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  const created = o.created_at;
  return {
    ...o,
    items: items ?? [],
    total_value: toNumber(o.total_value) ?? 0,
    delivery_fee: toNumber(o.delivery_fee) ?? 0,
    created_at:
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : new Date().toISOString(),
  };
}

export function salesToPlain(s: Record<string, unknown>) {
  return {
    ...s,
    revenue: toNumber(s.revenue),
    profit: toNumber(s.profit),
  };
}

export function invisibleCostsToDict(
  rows: { key: string; value: unknown }[]
): Record<string, number> {
  const dict: Record<string, number> = {};
  for (const r of rows) {
    dict[r.key] = toNumber(r.value) ?? 0;
  }
  return dict;
}
