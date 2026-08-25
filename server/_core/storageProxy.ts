import type { Express } from "express";
import { servePublicCatalogImage } from "../publicCatalogStorage";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*key", async (req, res) => {
    const captured = (req.params as Record<string, string | string[]>).key;
    const key = Array.isArray(captured) ? captured.join("/") : captured;
    await servePublicCatalogImage(req.method, key ?? "", res);
  });
}
