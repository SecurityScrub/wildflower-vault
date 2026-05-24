// Force-upsert the primary admin user from ADMIN_EMAIL + ADMIN_PASSWORD env
// vars. Runs on every deploy (via entrypoint.sh) so changing either env var
// in Railway and redeploying is enough to roll the credentials.
//
// What it does on every boot:
//   - Finds-or-creates a user at ADMIN_EMAIL with role = ADMIN
//   - Rehashes ADMIN_PASSWORD and overwrites passwordHash
//   - Clears MFA / lockout state so the operator can never get locked out
//   - Skips silently if either env var is unset
//
// .mjs so it runs straight from `node` in the standalone runner image, with
// no TypeScript build step needed.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.log("[bootstrap-admin] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: "ADMIN",
        failedLoginCount: 0,
        lockedUntil: null,
        mfaCodeHash: null,
        mfaCodeExpiresAt: null,
        mfaCodeAttempts: 0,
      },
      create: {
        email,
        name: "Admin",
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`[bootstrap-admin] Synced admin user ${user.email} (id=${user.id}).`);
  } catch (err) {
    console.error("[bootstrap-admin] Failed to sync admin:", err);
    // Don't crash boot — the app can still serve, and we don't want a bad
    // bootstrap to take prod down. Operator should investigate logs.
  } finally {
    await prisma.$disconnect();
  }
}

main();
