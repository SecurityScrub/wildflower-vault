import { getTurnstileConfig } from "./settings";

function isDisabled(): boolean {
  const v = process.env.TURNSTILE_DISABLED;
  return v === "1" || v === "true";
}

/** True when Turnstile is configured AND not disabled — callers should require
 * a token from the client. When false, callers should skip the check so the
 * user can submit without solving a challenge. */
export async function turnstileEnforced(): Promise<boolean> {
  if (isDisabled()) return false;
  const config = await getTurnstileConfig();
  return Boolean(config.secretKey);
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (isDisabled()) return true;

  const config = await getTurnstileConfig();
  if (!config.secretKey) {
    // No secret configured — treat as bypass (fail-open) to match the client
    // widgets, which skip rendering when no site key is set. To enforce
    // Turnstile, set TURNSTILE_SECRET_KEY (env) or the equivalent admin setting.
    return true;
  }

  const formData = new FormData();
  formData.append("secret", config.secretKey);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await res.json() as { success: boolean };
  return data.success;
}
