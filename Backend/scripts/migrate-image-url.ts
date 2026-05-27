import "reflect-metadata";
import "../load-env.ts";
import { AppDataSource } from "../database/data-source.ts";

async function migrateImageUrlColumn(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const rows: { data_type: string; character_maximum_length: number | null }[] =
    await AppDataSource.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'image_url'
    `);

  if (rows.length === 0) {
    console.log("[migrate] Tabela products ou coluna image_url ainda não existe.");
    return;
  }

  const col = rows[0];
  if (col.data_type === "text") {
    console.log("[migrate] products.image_url já é TEXT — nada a fazer.");
    return;
  }

  await AppDataSource.query(`
    ALTER TABLE products
    ALTER COLUMN image_url TYPE TEXT
    USING image_url::TEXT
  `);

  console.log(
    `[migrate] products.image_url alterado de ${col.data_type}` +
      (col.character_maximum_length ? `(${col.character_maximum_length})` : "") +
      " para TEXT."
  );
}

async function main() {
  await migrateImageUrlColumn();
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
