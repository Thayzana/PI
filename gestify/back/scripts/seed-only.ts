import "reflect-metadata";
import "../load-env.ts";
import { initializeDatabase, closeDatabase } from "../database/init.ts";

async function main() {
  await initializeDatabase();
  await closeDatabase();
  console.log("[db:seed] Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
