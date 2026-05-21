import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { projectRoot } from "./load-env.ts";

const PLACEHOLDER_KEYS = new Set([
  "",
  "MY_GEMINI_API_KEY",
  "sua-chave-gemini-aqui",
  "GEMINI_API_KEY",
]);

const geminiKeyFile = path.join(projectRoot, "back", ".gemini-key");

let aiClient: GoogleGenAI | null = null;

function isValidKey(key: string | undefined): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !PLACEHOLDER_KEYS.has(trimmed);
}

export function getGeminiApiKey(): string {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
  ];

  for (const candidate of candidates) {
    if (isValidKey(candidate)) {
      return candidate.trim();
    }
  }

  if (fs.existsSync(geminiKeyFile)) {
    const fileKey = fs.readFileSync(geminiKeyFile, "utf8").trim();
    if (isValidKey(fileKey)) {
      process.env.GEMINI_API_KEY = fileKey;
      return fileKey;
    }
  }

  throw new Error(
    "GEMINI_API_KEY não configurada. Adicione em Configurações → Chave Gemini, ou crie .env.local na raiz do projeto com GEMINI_API_KEY=sua_chave"
  );
}

export function saveGeminiApiKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!isValidKey(trimmed)) {
    throw new Error("Chave da API inválida. Cole a chave completa obtida em https://aistudio.google.com/apikey");
  }

  fs.mkdirSync(path.dirname(geminiKeyFile), { recursive: true });
  fs.writeFileSync(geminiKeyFile, trimmed, "utf8");

  const envLocalPath = path.join(projectRoot, ".env.local");
  const envLine = `GEMINI_API_KEY="${trimmed}"\n`;
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf8");
    if (/^\s*GEMINI_API_KEY\s*=/m.test(content)) {
      fs.writeFileSync(
        envLocalPath,
        content.replace(/^\s*GEMINI_API_KEY\s*=.*$/m, `GEMINI_API_KEY="${trimmed}"`),
        "utf8"
      );
    } else {
      fs.appendFileSync(envLocalPath, envLine, "utf8");
    }
  } else {
    fs.writeFileSync(envLocalPath, envLine, "utf8");
  }

  process.env.GEMINI_API_KEY = trimmed;
  aiClient = null;
}

export function isGeminiConfigured(): boolean {
  try {
    getGeminiApiKey();
    return true;
  } catch {
    return false;
  }
}

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = getGeminiApiKey();
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export function resetAiClient(): void {
  aiClient = null;
}
