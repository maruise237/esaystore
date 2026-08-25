import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeAuthAttempt: vi.fn(),
  clearAuthAttempts: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getSql: vi.fn(),
  getDb: vi.fn(),
  listUserShops: vi.fn(),
  writeSessionCookie: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("../authRateLimit", () => ({
  AUTH_RATE_LIMIT_MESSAGE: "Trop de tentatives. Réessayez dans 15 minutes.",
  consumeAuthAttempt: mocks.consumeAuthAttempt,
  clearAuthAttempts: mocks.clearAuthAttempts,
}));
vi.mock("../db", () => ({
  getUserByEmail: mocks.getUserByEmail,
  getUserById: mocks.getUserById,
  getSql: mocks.getSql,
  getDb: mocks.getDb,
  listUserShops: mocks.listUserShops,
}));
vi.mock("../auth", () => ({
  writeSessionCookie: mocks.writeSessionCookie,
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
  clearSessionCookie: vi.fn(),
}));

import { authRouter } from "./auth";

function context() {
  return { req: { headers: {}, ip: "198.51.100.42" } as never, res: {} as never, user: null };
}

describe("procédures publiques d’authentification", () => {
  it("bloque la connexion avant toute recherche de compte lorsque la limite est atteinte", async () => {
    mocks.consumeAuthAttempt.mockResolvedValue(true);
    const caller = authRouter.createCaller(context());
    await expect(caller.login({ email: "personne@example.invalid", password: "mot-de-passe" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "TOO_MANY_REQUESTS", message: "Trop de tentatives. Réessayez dans 15 minutes." });
    expect(mocks.getUserByEmail).not.toHaveBeenCalled();
  });

  it("ne révèle pas qu’un e-mail existe déjà lors de l’inscription", async () => {
    mocks.consumeAuthAttempt.mockResolvedValue(false);
    mocks.getUserByEmail.mockResolvedValue({ id: "existing-user" });
    const caller = authRouter.createCaller(context());
    await expect(caller.register({ name: "Nouvel utilisateur", email: "personne@example.invalid", password: "mot-de-passe-solide", shopName: "Boutique test", currency: "XAF", country: "CMR" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST", message: "La création de compte est impossible avec ces informations." });
    expect(mocks.clearAuthAttempts).not.toHaveBeenCalled();
  });
});
