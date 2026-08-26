import { describe, expect, it, vi } from "vitest";
import { getNeonSessionToken } from "./neonSessionToken";

describe("jeton de session Neon Auth", () => {
  it("ne demande pas de jeton lorsqu’aucune session n’existe", async () => {
    const token = vi.fn();
    const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
    const value = await getNeonSessionToken({ getSession, token });

    expect(value).toBeNull();
    expect(getSession).toHaveBeenCalledWith({ fetchOptions: { credentials: "include" } });
    expect(token).not.toHaveBeenCalled();
  });

  it("demande le jeton seulement après avoir trouvé une session", async () => {
    const token = vi.fn().mockResolvedValue({ data: { token: "jwt-neon" } });
    const getSession = vi.fn().mockResolvedValue({ data: { session: { id: "session" } } });
    const value = await getNeonSessionToken({ getSession, token });

    expect(value).toBe("jwt-neon");
    expect(token).toHaveBeenCalledOnce();
    expect(token).toHaveBeenCalledWith({ fetchOptions: { credentials: "include" } });
  });
});
