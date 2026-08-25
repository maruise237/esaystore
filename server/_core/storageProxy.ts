import type { Express } from "express";
import { servePublicCatalogImage } from "../publicCatalogStorage";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    await servePublicCatalogImage(req.method, key ?? "", res);
  });
}
