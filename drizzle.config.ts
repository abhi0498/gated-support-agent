import { defineConfig } from "drizzle-kit";

// One database, one migration history, built from both packages' schemas (ADR 0001).
export default defineConfig({
  dialect: "postgresql",
  schema: ["./packages/core/src/db/schema.ts", "./packages/pod/src/db/schema.ts"],
  out: "./drizzle",
  casing: "snake_case",
});
