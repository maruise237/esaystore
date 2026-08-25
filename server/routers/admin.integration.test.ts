import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { adminRouter } from "./admin";

const sql = getSql();
let adminId = "";
let userId = "";
let shopId = "";

function caller() {
  return adminRouter.createCaller({
    user: {
      id: adminId,
      email: `admin-${adminId}@example.invalid`,
      name: "Administrateur test",
      passwordHash: "not-used",
      loginMethod: "password",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      openId: null,
    },
    req: {} as never,
    res: {} as never,
  });
}

beforeEach(async () => {
  adminId = crypto.randomUUID();
  userId = crypto.randomUUID();
  shopId = crypto.randomUUID();
  await sql`
    INSERT INTO users (id, email, name, password_hash, role)
    VALUES
      (${adminId}, ${`admin-${adminId}@example.invalid`}, 'Administrateur test', 'not-used', 'admin'),
      (${userId}, ${`user-${userId}@example.invalid`}, 'Compte à superviser', 'not-used', 'user')
  `;
  await sql`
    INSERT INTO shops (id, name, slug, currency, country, created_by)
    VALUES (${shopId}, 'Boutique à superviser', ${`boutique-supervision-${shopId.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})
  `;
  await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`;
});

afterEach(async () => {
  await sql`DELETE FROM admin_audit_logs WHERE actor_id = ${adminId}`;
  await sql`DELETE FROM shop_members WHERE shop_id = ${shopId}`;
  await sql`DELETE FROM shops WHERE id = ${shopId}`;
  await sql`DELETE FROM users WHERE id IN (${adminId}, ${userId})`;
});

describe("parcours d’administration avec Neon", () => {
  it("supervise, suspend et réactive une boutique en journalisant les actions", async () => {
    const initialOverview = await caller().overview();
    expect(initialOverview.shops.total).toBeGreaterThan(0);

    const listed = await caller().shops({
      query: "Boutique à superviser",
      status: "all",
      limit: 10,
    });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.isActive).toBe(true);

    await caller().setShopActive({
      shopId,
      isActive: false,
      reason: "Vérification opérationnelle",
    });
    const [suspended] =
      await sql`SELECT is_active, suspension_reason FROM shops WHERE id = ${shopId}`;
    expect(suspended).toMatchObject({
      is_active: false,
      suspension_reason: "Vérification opérationnelle",
    });

    await caller().setShopActive({ shopId, isActive: true });
    const activity = await caller().activity({ limit: 20 });
    expect(activity.map(entry => entry.action)).toEqual(
      expect.arrayContaining(["shop_suspended", "shop_reactivated"])
    );
  });

  it("gère le statut et le rôle d’un compte sous supervision", async () => {
    await caller().setUserActive({ userId, isActive: false });
    let [target] =
      await sql`SELECT is_active, role FROM users WHERE id = ${userId}`;
    expect(target).toMatchObject({ is_active: false, role: "user" });

    await caller().setUserActive({ userId, isActive: true });
    await caller().setUserRole({ userId, role: "admin" });
    [target] =
      await sql`SELECT is_active, role FROM users WHERE id = ${userId}`;
    expect(target).toMatchObject({ is_active: true, role: "admin" });

    await caller().setUserRole({ userId, role: "user" });
    const activity = await caller().activity({ limit: 20 });
    expect(activity.map(entry => entry.action)).toEqual(
      expect.arrayContaining([
        "user_suspended",
        "user_reactivated",
        "user_promoted_to_admin",
        "user_demoted_to_user",
      ])
    );
  });
});
