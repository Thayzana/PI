import "reflect-metadata";
import "./load-env.ts";

import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { createServer as createViteServer } from "vite";

import router from "./routes.ts";
import { swaggerSpec } from "./swagger.ts";
import { projectRoot } from "./load-env.ts";
import { isGeminiConfigured } from "./gemini.ts";
import { initializeDatabase } from "./database/init.ts";

const rootDir = projectRoot;

const entryScript = (process.argv[1] ?? "").replace(/\\/g, "/");

const isProductionBundle =
  entryScript.endsWith("/dist/server.cjs") ||
  entryScript.endsWith("dist/server.cjs");

if (!process.env.NODE_ENV && isProductionBundle) {
  process.env.NODE_ENV = "production";
}

if (isGeminiConfigured()) {
  console.log("[env] GEMINI_API_KEY OK — marketing IA disponível.");
} else {
  console.warn(
    "[env] GEMINI_API_KEY ausente. Configure em: Configurações → Chave Gemini,\n" +
      'ou crie .env.local na raiz com GEMINI_API_KEY="sua-chave"'
  );
}

async function startServer() {
  await initializeDatabase();

  const app = express();
  const PORT = 3000;

  // Middleware JSON
  app.use(express.json());

  // Logs das requisições
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Swagger / OpenAPI
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

  // Rotas da API
  app.use("/api", router);

  // Ambiente de desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Iniciando servidor em modo desenvolvimento (Vite middleware)..."
    );

    const vite = await createViteServer({
      configFile: path.join(rootDir, "vite.config.ts"),
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // Produção
    console.log("Iniciando servidor em modo produção...");

    const distPath = path.join(rootDir, "dist");

    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(
      `Documentação Swagger: http://localhost:${PORT}/api-docs`
    );
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
});