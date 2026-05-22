// Minimal RFC 5545 .ics generator. Used for calendar invites attached to
// confirmation emails (works in Apple Mail, Gmail, Outlook, etc.).

import { randomUUID } from "crypto";

interface ICSEventInput {
  uid?: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  method?: "REQUEST" | "PUBLISH" | "CANCEL";
  url?: string;
}

function formatICSDate(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICSText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// Fold lines longer than 75 octets per RFC 5545.
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

export function buildICS(event: ICSEventInput): string {
  const uid = event.uid ?? `${randomUUID()}@thewildflowervault.com`;
  const method = event.method ?? "REQUEST";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Wild Flower Vault//Wedding Planning//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(event.start)}`,
    `DTEND:${formatICSDate(event.end)}`,
    `SUMMARY:${escapeICSText(event.summary)}`,
  ];

  if (event.description) lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeICSText(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);

  if (event.organizerEmail) {
    lines.push(
      `ORGANIZER;CN=${escapeICSText(event.organizerName ?? "The Wild Flower Vault")}:mailto:${event.organizerEmail}`,
    );
  }
  if (event.attendeeEmail) {
    lines.push(
      `ATTENDEE;CN=${escapeICSText(event.attendeeName ?? event.attendeeEmail)};RSVP=TRUE:mailto:${event.attendeeEmail}`,
    );
  }

  lines.push("STATUS:CONFIRMED", "SEQUENCE:0", "END:VEVENT", "END:VCALENDAR");

  return lines.map(fold).join("\r\n");
}

export function icsToBase64(ics: string): string {
  return Buffer.from(ics, "utf8").toString("base64");
}
