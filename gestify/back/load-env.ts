/**
 * Carrega variáveis de ambiente ANTES de qualquer outro módulo da aplicação.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

function findProjectRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), "gestify"),
  ];

  for (const dir of candidates) {
    const pkg = path.join(dir, "package.json");
    const hasBack = fs.existsSync(path.join(dir, "back"));
    const hasFront = fs.existsSync(path.join(dir, "front"));
    if (fs.existsSync(pkg) && (hasBack || hasFront)) {
      return dir;
    }
  }

  return path.resolve(__dirname, "..");
}

export const projectRoot = findProjectRoot();

const envFiles = [
  path.join(projectRoot, ".env"),
  path.join(projectRoot, ".env.local"),
  path.join(projectRoot, "back", ".env"),
  path.join(projectRoot, "back", ".env.local"),
];

for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

// Chave salva pela tela de Configurações (desenvolvimento local)
const geminiKeyFile = path.join(projectRoot, "back", ".gemini-key");
if (fs.existsSync(geminiKeyFile)) {
  const fileKey = fs.readFileSync(geminiKeyFile, "utf8").trim();
  if (fileKey && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = fileKey;
  }
}
