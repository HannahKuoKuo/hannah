import { execSync } from "node:child_process";

/**
 * Prepares the separate E2E database without wiping it:
 *   1. apply migrations (non-destructive)
 *   2. remove rows created by earlier E2E runs (names starting with "E2E ")
 *   3. re-seed demo data (the seed only replaces DEMO rows)
 */
export default function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? "postgresql://acesign:acesign_local_only@localhost:5432/acesign_hub_test?schema=public";
  if (!/_test\b|_test\?/.test(url)) throw new Error("E2E_DATABASE_URL must point at a database whose name ends in _test.");
  const env = { ...process.env, DATABASE_URL: url };
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
  execSync("npx tsx tests/e2e/cleanup.ts", { env, stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
}
