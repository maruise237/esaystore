import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getMembership: vi.fn(), getDb: vi.fn() }));
vi.mock("../db", () => ({
  getMembership: mocks.getMembership,
  getDb: mocks.getDb,
}));

import { assertShopAccess } from "./helpers";

describe("shop data isolation", () => {
  beforeEach(() => {
    mocks.getMembership.mockReset();
    mocks.getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: () => Promise.resolve([{ isActive: true }]) }),
        }),
      }),
    });
  });

  it("rejects a user who is not a member of the requested shop", async () => {
    mocks.getMembership.mockResolvedValue(undefined);
    await expect(assertShopAccess("user-a", "shop-b")).rejects.toMatchObject<
      Partial<TRPCError>
    >({ code: "FORBIDDEN" });
  });

  it("rejects a seller from an owner-only operation", async () => {
    mocks.getMembership.mockResolvedValue({ role: "seller" });
    await expect(
      assertShopAccess("user-a", "shop-a", ["owner", "manager"])
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "FORBIDDEN" });
  });

  it("allows a valid owner membership", async () => {
    mocks.getMembership.mockResolvedValue({ role: "owner" });
    await expect(
      assertShopAccess("user-a", "shop-a", ["owner", "manager"])
    ).resolves.toEqual({ role: "owner" });
  });

  it("rejects access to a suspended shop even for a valid member", async () => {
    mocks.getMembership.mockResolvedValue({ role: "owner" });
    mocks.getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ isActive: false }]),
          }),
        }),
      }),
    });
    await expect(assertShopAccess("user-a", "shop-a")).rejects.toMatchObject<
      Partial<TRPCError>
    >({ code: "FORBIDDEN" });
  });
});
