import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders, SECURITY_HEADERS } from "./securityHeaders";

describe("en-têtes de sécurité", () => {
  it("applique les protections navigateur attendues à chaque réponse serveur", () => {
    const setHeader = vi.fn();
    applySecurityHeaders({ setHeader } as never);
    expect(setHeader).toHaveBeenCalledTimes(Object.keys(SECURITY_HEADERS).length);
    expect(setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
    expect(setHeader).toHaveBeenCalledWith("Content-Security-Policy", expect.stringContaining("frame-ancestors 'none'"));
  });
});
