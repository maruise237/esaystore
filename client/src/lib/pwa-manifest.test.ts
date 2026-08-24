import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8")) as { display: string; start_url: string; scope: string; icons: Array<{ src: string; sizes: string }> };
const serviceWorkerRegistration = readFileSync(new URL("./offline.ts", import.meta.url), "utf8");

describe("prérequis PWA autonome", () => {
  it("declares standalone mode, a root start URL and installation icons", () => {
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }), expect.objectContaining({ src: "/icon-512.png", sizes: "512x512" })]));
  });

  it("registers the service worker across the full application scope", () => {
    expect(serviceWorkerRegistration).toContain('register("/sw.js", { scope: "/" })');
  });
});
