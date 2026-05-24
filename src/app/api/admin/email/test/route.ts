// Quick diagnostic endpoint: sends a tiny test email through the ZeptoMail
// HTTP API and returns the actual response (or error) so the admin can see
// exactly what's failing without combing through Railway logs.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getZeptoMailConfig, sendZeptoMail } from "@/lib/zeptomail";

function isAdmin(s: Session | null) {
  return (s?.user as { role?: string } | undefined)?.role === "ADMIN";
}

const Schema = z.object({ to: z.string().email().optional() });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const config = getZeptoMailConfig();
  if (!config.token || !config.fromEmail) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing ZEPTOMAIL_API_TOKEN or ZEPTOMAIL_FROM_EMAIL env vars.",
        details: {
          hasToken: Boolean(config.token),
          hasFromEmail: Boolean(config.fromEmail),
        },
      },
      { status: 400 },
    );
  }

  let parsed;
  try {
    parsed = Schema.parse(await req.json().catch(() => ({})));
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Invalid input", details: err }, { status: 400 });
  }

  const to = parsed.to ?? config.adminEmail;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "No recipient — set ADMIN_EMAIL or pass `to` in the request body." },
      { status: 400 },
    );
  }

  const now = new Date().toLocaleString("en-US", { timeZoneName: "short" });
  try {
    await sendZeptoMail({
      to: { address: to, name: "Admin Test" },
      subject: `[Test] Wild Flower Vault — ZeptoMail check (${now})`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #A8441E; margin-top: 0;">✓ ZeptoMail integration working</h2>
          <p style="color: #444; line-height: 1.5;">
            This is a diagnostic email triggered from <code>/admin/settings</code>.
            If you're reading this, the HTTP API is configured correctly.
          </p>
          <table style="font-size: 12px; color: #888; margin-top: 16px;">
            <tr><td>From</td><td style="padding-left: 12px;">${config.fromEmail}</td></tr>
            <tr><td>To</td><td style="padding-left: 12px;">${to}</td></tr>
            <tr><td>Sent at</td><td style="padding-left: 12px;">${now}</td></tr>
          </table>
        </div>
      `,
    });
    return NextResponse.json({
      ok: true,
      message: `Test email sent to ${to}.`,
      from: config.fromEmail,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        from: config.fromEmail,
        to,
        hint: "Common causes: (1) the From email domain isn't verified in ZeptoMail → Mail Agents, (2) the API token was pasted with the 'Zoho-enczapikey ' prefix (we strip it but check anyway), (3) the Mail Agent is disabled or in sandbox mode.",
      },
      { status: 500 },
    );
  }
}
