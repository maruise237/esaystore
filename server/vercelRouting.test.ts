import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  rewrites: Array<{ source: string; destination: string }>;
};

describe("routage Vercel de la SPA", () => {
  it("redirige les routes publiques comme /auth vers l’entrée SPA sans intercepter les API", () => {
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as VercelConfig;

    expect(config.rewrites).toContainEqual({
      source: "/:path((?!api(?:/|$)).*)",
      destination: "/index.html",
    });
    expect(config.rewrites).toContainEqual({
      source: "/manus-storage/:path*",
      destination: "/api/manus-storage/:path*",
    });
  });
});
