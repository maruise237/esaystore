import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function merchantContext(): TrpcContext {
  return {
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      openId: null,
      email: "merchant@example.com",
      name: "Marchand",
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

describe("protections de l’administration SaaS", () => {
  it("refuse les indicateurs globaux à un compte marchand", async () => {
    const caller = appRouter.createCaller(merchantContext());
    await expect(caller.admin.overview()).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: "FORBIDDEN",
    });
  });

  it("refuse la suspension d’un compte à un compte marchand", async () => {
    const caller = appRouter.createCaller(merchantContext());
    await expect(
      caller.admin.setUserActive({
        userId: "00000000-0000-4000-8000-000000000002",
        isActive: false,
      })
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });
});
