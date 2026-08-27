import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL is required to apply the shop contact details migration."
  );
}

const sql = neon(connectionString);
await sql`ALTER TABLE shops ADD COLUMN IF NOT EXISTS address varchar(280)`;
await sql`ALTER TABLE shops ADD COLUMN IF NOT EXISTS contact_phone varchar(48)`;
const columns = await sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'shops'
    AND column_name IN ('address', 'contact_phone')
`;
if (columns.length !== 2) {
  throw new Error("Shop contact detail columns were not created.");
}
console.log(
  "Verified shops.address and shops.contact_phone on Neon PostgreSQL."
);
