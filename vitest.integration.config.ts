import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: [
      "server/neon.connection.test.ts",
      "server/neon.schema.test.ts",
      "server/routers/commerce.integration.test.ts",
      "server/routers/closing.integration.test.ts",
      "server/routers/migration.integration.test.ts",
      "server/routers/currencies.integration.test.ts",
      "server/routers/admin.integration.test.ts",
    ],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    retry: 2,
  },
});
