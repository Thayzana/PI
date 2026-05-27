import { AppDataSource } from "./data-source.ts";
import { migrateImageUrlColumn } from "./migrate-image-url.ts";
import { runSeeds } from "../seeds/run-seeds.ts";

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    const url = process.env.DATABASE_URL || "postgresql://localhost:5432/gestify";
    const host = url.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    console.log("[db] PostgreSQL conectado:", host);
  }

  await migrateImageUrlColumn();

  await runSeeds();
  initialized = true;
  console.log("[db] Seeds verificados — base pronta.");
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    initialized = false;
  }
}
