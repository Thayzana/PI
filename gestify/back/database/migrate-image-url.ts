import { AppDataSource } from "./data-source.ts";

/** Migra products.image_url de varchar(512) para TEXT (idempotente) */
export async function migrateImageUrlColumn(): Promise<void> {
  const rows: { data_type: string; character_maximum_length: number | null }[] =
    await AppDataSource.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'image_url'
    `);

  if (rows.length === 0) {
    return;
  }

  const col = rows[0];
  if (col.data_type === "text") {
    console.log("[db] products.image_url já é TEXT");
    return;
  }

  await AppDataSource.query(`
    ALTER TABLE products
    ALTER COLUMN image_url TYPE TEXT
    USING image_url::TEXT
  `);

  console.log(
    `[db] products.image_url migrado para TEXT (era ${col.data_type}` +
      (col.character_maximum_length ? ` ${col.character_maximum_length}` : "") +
      ")"
  );
}
