// Email block schema + HTML renderer for the marketing platform.
//
// Templates are stored as a JSON array of blocks. Each block is a small
// strongly-typed shape with its own fields (text, image url, button link).
// The renderer walks the array, escapes user content, substitutes
// {{name}} / {{email}} / {{first_name}} merge fields, wraps everything in a
// brand-styled outer layout with a footer unsubscribe link, and returns the
// final HTML string.

export type EmailBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "image"; url: string; alt?: string }
  | { kind: "button"; text: string; url: string }
  | { kind: "divider" }
  | { kind: "signature"; signoff: string; name: string };

export interface RecipientContext {
  email: string;
  name?: string | null;
}

export interface RenderContext {
  recipient: RecipientContext;
  unsubscribeUrl: string;
  siteUrl?: string;
  businessName?: string;
}

const BRAND_ORANGE = "#A8441E";
const BRAND_PINK = "#D98E84";
const BRAND_CREAM = "#F9EFEC";
const TEXT = "#2D1F1D";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function substitute(text: string, recipient: RecipientContext): string {
  const name = recipient.name?.trim() ?? "";
  const firstName = name.split(/\s+/)[0] ?? "";
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, name || "there")
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName || "there")
    .replace(/\{\{\s*email\s*\}\}/gi, recipient.email);
}

function renderBlock(block: EmailBlock, ctx: RenderContext): string {
  switch (block.kind) {
    case "heading": {
      const text = escapeHtml(substitute(block.text, ctx.recipient));
      return `
        <h2 style="font-family: Georgia, 'Times New Roman', serif; color: ${BRAND_ORANGE}; font-size: 26px; line-height: 1.2; margin: 0 0 18px; font-weight: normal;">${text}</h2>
      `;
    }
    case "paragraph": {
      const text = escapeHtml(substitute(block.text, ctx.recipient)).replace(/\n/g, "<br/>");
      return `
        <p style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: ${TEXT}; font-size: 15px; line-height: 1.6; margin: 0 0 18px;">${text}</p>
      `;
    }
    case "image": {
      const url = escapeHtml(block.url);
      const alt = escapeHtml(block.alt ?? "");
      if (!url) return "";
      return `
        <p style="margin: 0 0 18px; text-align: center;">
          <img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; display: inline-block;" />
        </p>
      `;
    }
    case "button": {
      const text = escapeHtml(substitute(block.text, ctx.recipient));
      const url = escapeHtml(block.url);
      if (!url) return "";
      return `
        <p style="margin: 0 0 18px; text-align: center;">
          <a href="${url}" style="display: inline-block; background: ${BRAND_PINK}; color: #ffffff; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 28px; text-decoration: none;">${text}</a>
        </p>
      `;
    }
    case "divider":
      return `<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />`;
    case "signature": {
      const signoff = escapeHtml(substitute(block.signoff, ctx.recipient));
      const name = escapeHtml(block.name);
      return `
        <p style="font-family: Georgia, 'Times New Roman', serif; color: ${BRAND_ORANGE}; font-style: italic; font-size: 16px; margin: 18px 0 0;">${signoff},</p>
        <p style="font-family: Georgia, 'Times New Roman', serif; color: ${BRAND_ORANGE}; font-style: italic; font-size: 16px; margin: 4px 0 0;">${name}</p>
      `;
    }
    default:
      return "";
  }
}

export function renderEmail(blocks: EmailBlock[], ctx: RenderContext): string {
  const businessName = ctx.businessName ?? "The Wild Flower Vault";
  const body = blocks.map((b) => renderBlock(b, ctx)).join("\n");
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin: 0; padding: 0; background: ${BRAND_CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND_CREAM}; padding: 24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff;">
        <tr><td style="background: ${BRAND_ORANGE}; padding: 32px; text-align: center;">
          <div style="font-family: Georgia, 'Times New Roman', serif; color: #ffffff; font-size: 22px; letter-spacing: 0.18em;">THE WILD FLOWER</div>
          <div style="font-family: -apple-system, sans-serif; color: ${BRAND_PINK}; font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; margin-top: 4px;">Vault</div>
        </td></tr>
        <tr><td style="padding: 36px 36px 24px;">${body}</td></tr>
        <tr><td style="padding: 16px 36px 32px; border-top: 1px solid #f0e8e3; font-family: -apple-system, sans-serif; font-size: 12px; color: #999; text-align: center;">
          <p style="margin: 0 0 8px;">${escapeHtml(businessName)} · Des Moines, Iowa</p>
          <p style="margin: 0;">
            <a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
            from these emails. We&apos;ll still send transactional emails like booking confirmations.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
  `.trim();
}

export function renderSubject(subject: string, recipient: RecipientContext): string {
  return substitute(subject, recipient);
}
