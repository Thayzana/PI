import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  Product,
  Recipe,
  RecipeIngredient,
  InvisibleCost,
  SalesHistory,
  Promotion,
  Supplier,
  Order,
} from "../entities/index.ts";

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/gestify"
  );
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: getDatabaseUrl(),
  synchronize: true,
  logging: process.env.DB_LOGGING === "true",
  entities: [
    Product,
    Recipe,
    RecipeIngredient,
    InvisibleCost,
    SalesHistory,
    Promotion,
    Supplier,
    Order,
  ],
});
