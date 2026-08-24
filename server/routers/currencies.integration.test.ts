import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSql } from "../db";
import { currenciesRouter } from "./currencies";

const sql = getSql();
let userId = "";
let firstShopId = "";
let secondShopId = "";

function caller() {
  return currenciesRouter.createCaller({ user: { id: userId, email: `currency-${userId}@example.invalid`, name: "Currency Test", passwordHash: "not-used", role: "user", isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as never, res: {} as never });
}

beforeEach(async () => {
  userId = crypto.randomUUID(); firstShopId = crypto.randomUUID(); secondShopId = crypto.randomUUID();
  await sql`INSERT INTO users (id, email, name, password_hash) VALUES (${userId}, ${`currency-${userId}@example.invalid`}, 'Currency Test', 'not-used')`;
  for (const [id, name] of [[firstShopId, "Première boutique"], [secondShopId, "Seconde boutique"]]) {
    await sql`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${id}, ${name}, ${`${name.toLowerCase().replace(/ /g, "-")}-${id.slice(0, 8)}`}, 'XAF', 'CMR', ${userId})`;
    await sql`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${id}, ${userId}, 'owner')`;
    await sql`INSERT INTO shop_currencies (shop_id, currency, is_active) VALUES (${id}, 'XOF', true)`;
  }
  await sql`INSERT INTO exchange_rates (shop_id, currency, rate_to_base, created_by) VALUES (${firstShopId}, 'XOF', 2, ${userId}), (${secondShopId}, 'XOF', 3, ${userId})`;
});

afterEach(async () => {
  await sql`DELETE FROM exchange_rates WHERE shop_id IN (${firstShopId}, ${secondShopId})`;
  await sql`DELETE FROM shop_currencies WHERE shop_id IN (${firstShopId}, ${secondShopId})`;
  await sql`DELETE FROM shop_members WHERE shop_id IN (${firstShopId}, ${secondShopId})`;
  await sql`DELETE FROM shops WHERE id IN (${firstShopId}, ${secondShopId})`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
});

describe("taux de change par boutique avec Neon", () => {
  it("returns the active rate from the requested shop only", async () => {
    const first = await caller().quote({ shopId: firstShopId, currency: "XOF" });
    const second = await caller().quote({ shopId: secondShopId, currency: "XOF" });
    expect(first.baseCurrency).toBe("XAF"); expect(first.rateToBase).toBe(2); expect(second.rateToBase).toBe(3);
  });
});
