import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("EASYSTOR schema on Neon", () => {
  it("contains the protected operational tables", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'shops', 'shop_members', 'products', 'sales', 'sale_items', 'receivables', 'repayments', 'stock_movements', 'sync_operations')`;
    expect(rows.map((row) => row.table_name).sort()).toEqual([
      "products", "receivables", "repayments", "sale_items", "sales", "shop_members", "shops", "stock_movements", "sync_operations", "users",
    ]);
  });

  it("contains the optional profile columns used by the published application", async () => {
    const sql = neon(process.env.NEON_DATABASE_URL!);
    const rows = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND ((table_name = 'users' AND column_name = 'phone') OR (table_name = 'shops' AND column_name = 'logo_url'))
    `;
    expect(rows.map((row) => row.column_name).sort()).toEqual(["logo_url", "phone"]);
  });
});
