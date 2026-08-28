import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL is required to apply the shop receipt note migration."
  );
}

const sql = neon(connectionString);
await sql`ALTER TABLE shops ADD COLUMN IF NOT EXISTS receipt_note varchar(220)`;
const columns = await sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'shops'
    AND column_name = 'receipt_note'
`;
if (!columns[0]) throw new Error("Shop receipt note column was not created.");
console.log("Verified shops.receipt_note on Neon PostgreSQL.");
