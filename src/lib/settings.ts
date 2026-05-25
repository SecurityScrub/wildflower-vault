import { prisma } from "./prisma";
import { decrypt, encrypt } from "./utils";

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  if (setting.isSecret && setting.value) {
    try {
      return decrypt(setting.value);
    } catch {
      return null;
    }
  }
  return setting.value;
}

export async function setSetting(
  key: string,
  value: string,
  opts?: { isSecret?: boolean; label?: string; group?: string; updatedBy?: string }
): Promise<void> {
  const storedValue = opts?.isSecret ? encrypt(value) : value;
  await prisma.setting.upsert({
    where: { key },
    update: { value: storedValue, updatedBy: opts?.updatedBy },
    create: {
      key,
      value: storedValue,
      isSecret: opts?.isSecret ?? false,
      label: opts?.label,
      group: opts?.group ?? "general",
      updatedBy: opts?.updatedBy,
    },
  });
}

export async function getSettingGroup(group: string) {
  const settings = await prisma.setting.findMany({ where: { group } });
  return Object.fromEntries(
    await Promise.all(
      settings.map(async (s) => {
        let val = s.value;
        if (s.isSecret && val) {
          try { val = decrypt(val); } catch { val = ""; }
        }
        return [s.key, val];
      })
    )
  );
}

// Typed accessors with env fallbacks
export async function getSquareConfig() {
  return {
    accessToken:
      (await getSetting("square_access_token")) ?? process.env.SQUARE_ACCESS_TOKEN ?? "",
    applicationId:
      (await getSetting("square_application_id")) ?? process.env.SQUARE_APPLICATION_ID ?? "",
    // Optional override. Empty = auto-discover via the Locations API.
    locationId:
      (await getSetting("square_location_id")) ?? process.env.SQUARE_LOCATION_ID ?? "",
    environment:
      (await getSetting("square_environment")) ?? process.env.SQUARE_ENVIRONMENT ?? "sandbox",
    // Optional. Without it, /api/square/webhook rejects all deliveries.
    webhookKey:
      (await getSetting("square_webhook_key")) ?? process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "",
  };
}

export async function getTurnstileConfig() {
  return {
    siteKey:
      (await getSetting("turnstile_site_key")) ??
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    secretKey:
      (await getSetting("turnstile_secret_key")) ?? process.env.TURNSTILE_SECRET_KEY ?? "",
  };
}

