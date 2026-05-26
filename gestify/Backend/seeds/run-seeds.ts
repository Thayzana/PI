import { AppDataSource } from "../database/data-source.ts";
import { Product } from "../entities/Product.ts";
import { Recipe } from "../entities/Recipe.ts";
import { RecipeIngredient } from "../entities/RecipeIngredient.ts";
import { InvisibleCost } from "../entities/InvisibleCost.ts";
import { SalesHistory } from "../entities/SalesHistory.ts";
import { Promotion } from "../entities/Promotion.ts";
import { Supplier } from "../entities/Supplier.ts";
import { Order } from "../entities/Order.ts";
import {
  SEED_INVISIBLE_COSTS,
  SEED_PRODUCTS,
  SEED_RECIPE,
  SEED_SALES_HISTORY,
  SEED_PROMOTIONS,
  SEED_SUPPLIERS,
  buildSeedOrders,
} from "./seed-data.ts";

/** Preenche tabelas vazias — seguro em cada implantação (idempotente) */
export async function runSeeds(): Promise<void> {
  const productRepo = AppDataSource.getRepository(Product);
  const recipeRepo = AppDataSource.getRepository(Recipe);
  const ingRepo = AppDataSource.getRepository(RecipeIngredient);
  const costRepo = AppDataSource.getRepository(InvisibleCost);
  const salesRepo = AppDataSource.getRepository(SalesHistory);
  const promoRepo = AppDataSource.getRepository(Promotion);
  const supplierRepo = AppDataSource.getRepository(Supplier);
  const orderRepo = AppDataSource.getRepository(Order);

  if ((await costRepo.count()) === 0) {
    await costRepo.save(SEED_INVISIBLE_COSTS.map((c) => costRepo.create(c)));
    console.log("[seed] Custos invisíveis");
  }

  if ((await productRepo.count()) === 0) {
    await productRepo.save(SEED_PRODUCTS.map((p) => productRepo.create(p)));
    console.log("[seed] Produtos");
  }

  if ((await recipeRepo.count()) === 0) {
    const recipe = recipeRepo.create({
      name: SEED_RECIPE.name,
      yield: SEED_RECIPE.yield,
      margin_ratio: SEED_RECIPE.margin_ratio,
      final_price: SEED_RECIPE.final_price,
      unit_cost: SEED_RECIPE.unit_cost,
      invisible_costs: SEED_RECIPE.invisible_costs,
      subtotal: SEED_RECIPE.subtotal,
    });
    const saved = await recipeRepo.save(recipe);
    await ingRepo.save(
      SEED_RECIPE.ingredients.map((ing) =>
        ingRepo.create({ ...ing, recipe_id: saved.id })
      )
    );
    console.log("[seed] Receitas");
  }

  if ((await salesRepo.count()) === 0) {
    await salesRepo.save(SEED_SALES_HISTORY.map((s) => salesRepo.create(s)));
    console.log("[seed] Histórico de vendas");
  }

  if ((await promoRepo.count()) === 0) {
    await promoRepo.save(SEED_PROMOTIONS.map((p) => promoRepo.create(p)));
    console.log("[seed] Promoções");
  }

  if ((await supplierRepo.count()) === 0) {
    await supplierRepo.save(SEED_SUPPLIERS.map((s) => supplierRepo.create(s)));
    console.log("[seed] Fornecedores");
  }

  if ((await orderRepo.count()) === 0) {
    await orderRepo.save(buildSeedOrders().map((o) => orderRepo.create(o)));
    console.log("[seed] Pedidos");
  }
}
