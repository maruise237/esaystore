import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ serve: vi.fn() }));
vi.mock("../../server/publicCatalogStorage", () => ({ servePublicCatalogImage: mocks.serve }));

import handler from "./[...key]";

describe("route serverless manus-storage", () => {
  it("recompose les segments de clé Vercel et délègue au proxy sécurisé", async () => {
    const req = { method: "GET", query: { key: ["shops", "shop-id", "catalog", "product", "photo.webp"] } } as unknown as Request;
    const res = {} as Response;
    await handler(req, res);
    expect(mocks.serve).toHaveBeenCalledWith("GET", "shops/shop-id/catalog/product/photo.webp", res);
  });
});
