import "reflect-metadata";
import pg from "pg";
import "../load-env.ts";

const dbName = "projetoFinal";

function getAdminUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida em .env.local");
  }
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

async function main() {
  const client = new pg.Client({ connectionString: getAdminUrl() });
  await client.connect();

  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );

  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[db] Banco "${dbName}" criado.`);
  } else {
    console.log(`[db] Banco "${dbName}" já existe.`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
