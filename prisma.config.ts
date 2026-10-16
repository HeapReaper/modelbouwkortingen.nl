import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js gebruikt .env.local; laad die eerst, daarna .env als fallback.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Geen env(): `prisma generate` (o.a. in de Docker-build) moet ook zonder DATABASE_URL werken.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
