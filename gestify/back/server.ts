import "./load-env.ts";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import router from "./routes.ts";
import { projectRoot } from "./load-env.ts";
import { isGeminiConfigured } from "./gemini.ts";

const rootDir = projectRoot;
const entryScript = (process.argv[1] ?? "").replace(/\\/g, "/");
const isProductionBundle =
  entryScript.endsWith("/dist/server.cjs") || entryScript.endsWith("dist/server.cjs");

if (!process.env.NODE_ENV && isProductionBundle) {
  process.env.NODE_ENV = "production";
}

if (isGeminiConfigured()) {
  console.log("[env] GEMINI_API_KEY OK — marketing IA disponível.");
} else {
  console.warn(
    "[env] GEMINI_API_KEY ausente. Configure em: Configurações → Chave Gemini,\n" +
      '       ou crie .env.local na raiz com GEMINI_API_KEY="sua-chave"'
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Request Parsing Middleware
  app.use(express.json());

  // Log incoming backend requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Mount Confeitaria Studio API Router
  app.use("/api", router);

  // Configure Vite Development Server Middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Iniciando servidor em modo desenvolvimento (Vite dev middleware)...");
    const vite = await createViteServer({
      configFile: path.join(rootDir, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando servidor em modo produção...");
    const distPath = path.join(rootDir, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor express:", error);
});
