import type { Response } from "express";
import { storageGetSignedUrl } from "./storage";

const catalogKey = /^shops\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/catalog\/(?:product|variant)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-9a-f]{8}\.(?:png|jpe?g|webp)$/i;
const allowedContentTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export function isPublicCatalogStorageKey(value: string) {
  return catalogKey.test(value);
}

export async function servePublicCatalogImage(method: string | undefined, key: string, res: Response) {
  if (!isPublicCatalogStorageKey(key)) {
    res.status(404).send("Image introuvable.");
    return;
  }
  if (method !== "GET" && method !== "HEAD") {
    res.status(405).set("Allow", "GET, HEAD").send("Méthode non autorisée.");
    return;
  }

  try {
    const signedUrl = await storageGetSignedUrl(key);
    const source = await fetch(signedUrl);
    if (!source.ok) {
      res.status(404).send("Image introuvable.");
      return;
    }
    const contentType = source.headers.get("content-type")?.split(";", 1)[0]?.toLowerCase() ?? "";
    if (!allowedContentTypes.has(contentType)) {
      res.status(502).send("Format d’image non pris en charge.");
      return;
    }
    res.set({ "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
    if (method === "HEAD") {
      res.status(200).end();
      return;
    }
    res.status(200).send(Buffer.from(await source.arrayBuffer()));
  } catch (error) {
    console.error("[CatalogStorage] failed to serve public image", error);
    res.status(502).send("Image temporairement indisponible.");
  }
}
