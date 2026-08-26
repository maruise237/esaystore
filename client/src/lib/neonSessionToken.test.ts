import { describe, expect, it, vi } from "vitest";
import { getNeonSessionToken } from "./neonSessionToken";

describe("jeton de session Neon Auth", () => {
  it("ne demande pas de jeton lorsqu’aucune session n’existe", async () => {
    const token = vi.fn();
    const value = await getNeonSessionToken({ getSession: vi.fn().mockResolvedValue({ data: { session: null } }), token });

    expect(value).toBeNull();
    expect(token).not.toHaveBeenCalled();
  });

  it("demande le jeton seulement après avoir trouvé une session", async () => {
    const token = vi.fn().mockResolvedValue({ data: { token: "jwt-neon" } });
    const value = await getNeonSessionToken({ getSession: vi.fn().mockResolvedValue({ data: { session: { id: "session" } } }), token });

    expect(value).toBe("jwt-neon");
    expect(token).toHaveBeenCalledOnce();
  });
});
