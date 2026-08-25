import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { ENV } from "../_core/env";

const dbMocks = vi.hoisted(() => ({
  auditInsert: vi.fn(),
}));

function emptySelectQuery() {
  return Object.assign(Promise.resolve([]), { limit: async () => [] });
}

vi.mock("../db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => emptySelectQuery(),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [{ id: "owner-user" }],
        }),
      }),
    }),
    insert: () => ({
      values: async (value: unknown) => dbMocks.auditInsert(value),
    }),
  }),
}));

const { adminRouter } = await import("./admin");

function ownerContext(): TrpcContext {
  return {
    user: {
      id: "00000000-0000-4000-8000-000000000010",
      openId: null,
      email: ENV.platformOwnerEmail,
      name: "Propriétaire plateforme",
      passwordHash: "hash",
      loginMethod: "password",
      role: "user",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("initialisation propriétaire de l’administration SaaS", () => {
  it("autorise uniquement le compte propriétaire configuré quand aucun administrateur n’existe", async () => {
    const caller = adminRouter.createCaller(ownerContext());

    await expect(caller.bootstrapStatus()).resolves.toEqual({
      available: true,
      canClaimInitialAccess: true,
    });
    await expect(caller.claimInitialAccess()).resolves.toEqual({
      role: "admin",
    });
    expect(dbMocks.auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "initial_admin_claimed",
        actorId: "00000000-0000-4000-8000-000000000010",
      })
    );
  });
});
