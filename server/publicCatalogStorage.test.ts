import type { Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signedUrl: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: mocks.signedUrl }));

import { isPublicCatalogStorageKey, servePublicCatalogImage } from "./publicCatalogStorage";

const shopId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const targetId = "11111111-2222-4333-8444-555555555555";
const validKey = `shops/${shopId}/catalog/product/${targetId}_a1b2c3d4.webp`;

function response() {
  const res = {
    status: vi.fn(), set: vi.fn(), send: vi.fn(), end: vi.fn(),
  } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  vi.mocked(res.set).mockReturnValue(res);
  return res;
}

beforeEach(() => {
  mocks.signedUrl.mockResolvedValue("https://signed.example/image.webp");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("public catalog storage keys", () => {
  it("accepts only hashed catalogue image keys", () => {
    expect(isPublicCatalogStorageKey(validKey)).toBe(true);
    expect(isPublicCatalogStorageKey(`shops/${shopId}/catalog/variant/${targetId}_a1b2c3d4.jpg`)).toBe(true);
  });

  it("rejects traversal attempts and non-catalogue storage keys", async () => {
    expect(isPublicCatalogStorageKey("../../secrets.txt")).toBe(false);
    expect(isPublicCatalogStorageKey(`shops/${shopId}/private/document.pdf`)).toBe(false);
    expect(isPublicCatalogStorageKey(`shops/${shopId}/catalog/product/${targetId}.png`)).toBe(false);
    const res = response();
    await servePublicCatalogImage("GET", "../../secrets.txt", res);
    expect(mocks.signedUrl).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("proxies a valid image through the application origin with a safe content type", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2]), { status: 200, headers: { "content-type": "image/webp" } })));
    const res = response();
    await servePublicCatalogImage("GET", validKey, res);
    expect(mocks.signedUrl).toHaveBeenCalledWith(validKey);
    expect(res.set).toHaveBeenCalledWith(expect.objectContaining({ "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();
  });
});
