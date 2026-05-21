import { getTurnstileConfig } from "./settings";

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const config = await getTurnstileConfig();
  if (!config.secretKey) {
    if (process.env.NODE_ENV === "development") return true;
    return false;
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
