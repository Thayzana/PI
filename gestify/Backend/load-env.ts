/**
 * Carrega variáveis de ambiente ANTES de qualquer outro módulo da aplicação.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

/** Raiz do Backend (pasta deste package) */
export const projectRoot = path.resolve(__dirname);

const envFiles = [
  path.join(projectRoot, ".env"),
  path.join(projectRoot, ".env.local"),
];

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const geminiKeyFile = path.join(projectRoot, ".gemini-key");
if (fs.existsSync(geminiKeyFile)) {
  const fileKey = fs.readFileSync(geminiKeyFile, "utf8").trim();
  if (fileKey && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = fileKey;
  }
}
