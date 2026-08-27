import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "NEON_DATABASE_URL is required to apply the shop logo migration."
  );

const sql = neon(connectionString);
await sql`ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url varchar(1024)`;
const columns = await sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'logo_url'
`;
if (!columns[0]) throw new Error("Shop logo column was not created.");
console.log("Verified shops.logo_url on Neon PostgreSQL.");
