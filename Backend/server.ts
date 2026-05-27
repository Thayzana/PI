import "reflect-metadata";
import "./load-env.ts";

import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import router from "./routes.ts";
import { swaggerSpec } from "./swagger.ts";
import { isGeminiConfigured } from "./gemini.ts";
import { initializeDatabase } from "./database/init.ts";

const PORT = Number(process.env.PORT) || 3000;

if (isGeminiConfigured()) {
  console.log("[env] GEMINI_API_KEY OK — marketing IA disponível.");
} else {
  console.warn(
    "[env] GEMINI_API_KEY ausente. Configure em: Configurações → Chave Gemini,\n" +
      'ou crie Backend/.env.local com GEMINI_API_KEY="sua-chave"'
  );
}

async function startServer() {
  await initializeDatabase();

  const app = express();

  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.FRONTEND_URL,
      ].filter(Boolean) as string[],
      credentials: true,
    })
  );

  app.use(express.json());

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Gestify API Docs",
    })
  );

  app.use("/api", router);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API Gestify rodando em http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
});
