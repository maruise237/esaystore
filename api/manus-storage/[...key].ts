import type { Request, Response } from "express";
import { servePublicCatalogImage } from "../../server/publicCatalogStorage";

function keyFromRequest(req: Request) {
  const value = req.query.key;
  return Array.isArray(value) ? value.join("/") : typeof value === "string" ? value : "";
}

export default async function handler(req: Request, res: Response) {
  await servePublicCatalogImage(req.method, keyFromRequest(req), res);
}
