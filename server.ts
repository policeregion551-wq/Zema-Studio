import "dotenv/config";
import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import {
  handlePhotoToVideo,
  handleTextToAd,
  handleTextToMusic,
  handleTextToVideo,
  parseApiError,
} from "./api/_lib/geminiStudio.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: "25mb" }));

  app.use("/api", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/text-to-music", async (req, res) => {
    try {
      const result = await handleTextToMusic(req.body ?? {});
      res.json(result);
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.post("/api/text-to-ad", async (req, res) => {
    try {
      const result = await handleTextToAd(req.body ?? {});
      res.json(result);
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.post("/api/text-to-video", async (req, res) => {
    try {
      const result = await handleTextToVideo(req.body ?? {});
      res.json(result);
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.post("/api/photo-to-video", async (req, res) => {
    try {
      const result = await handlePhotoToVideo(req.body ?? {});
      res.json(result);
    } catch (err) {
      const parsed = parseApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith("/api")) {
        const parsed = parseApiError(err);
        res.status(parsed.status).json({ error: parsed.message });
        return;
      }
      next(err);
    }
  );

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Not found");
      }
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
