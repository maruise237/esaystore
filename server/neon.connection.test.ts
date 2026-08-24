import { neon } from "@neondatabase/serverless";
import { describe, expect, it } from "vitest";

describe("Neon PostgreSQL connection", () => {
  it("executes a lightweight server-side query", async () => {
    const databaseUrl = process.env.NEON_DATABASE_URL;

    expect(databaseUrl).toMatch(/^postgresql:\/\//);

    const sql = neon(databaseUrl!);
    const result = await sql`select 1 as connected`;

    expect(result).toEqual([{ connected: 1 }]);
  });
});
