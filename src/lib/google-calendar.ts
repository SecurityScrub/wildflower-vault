import { google, calendar_v3 } from "googleapis";
import { getGoogleCalendarConfig } from "./settings";

async function getCalendarClient() {
  const config = await getGoogleCalendarConfig();
  if (!config.enabled || !config.serviceAccountJson) return null;

  let serviceAccount: Record<string, string>;
  try {
    const json = Buffer.from(config.serviceAccountJson, "base64").toString("utf8");
    serviceAccount = JSON.parse(json);
  } catch {
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return { calendar: google.calendar({ version: "v3", auth }), calendarId: config.calendarId };
}

export async function createCalendarEvent(params: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}): Promise<string | null> {
  const client = await getCalendarClient();
  if (!client) return null;

  const event: calendar_v3.Schema$Event = {
    summary: params.title,
    description: params.description,
    location: params.location,
    start: { dateTime: params.startDate.toISOString(), timeZone: "America/Chicago" },
    end: { dateTime: params.endDate.toISOString(), timeZone: "America/Chicago" },
    colorId: "2", // sage green
  };

  const res = await client.calendar.events.insert({
    calendarId: client.calendarId,
    requestBody: event,
  });

  return res.data.id ?? null;
}

export async function updateCalendarEvent(
  eventId: string,
  params: Partial<{
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
  }>
): Promise<void> {
  const client = await getCalendarClient();
  if (!client) return;

  const update: calendar_v3.Schema$Event = {};
  if (params.title) update.summary = params.title;
  if (params.description) update.description = params.description;
  if (params.location) update.location = params.location;
  if (params.startDate)
    update.start = { dateTime: params.startDate.toISOString(), timeZone: "America/Chicago" };
  if (params.endDate)
    update.end = { dateTime: params.endDate.toISOString(), timeZone: "America/Chicago" };

  await client.calendar.events.patch({
    calendarId: client.calendarId,
    eventId,
    requestBody: update,
  });
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const client = await getCalendarClient();
  if (!client) return;
  await client.calendar.events.delete({ calendarId: client.calendarId, eventId });
}

export async function getBookedDates(
  start: Date,
  end: Date
): Promise<Array<{ start: Date; end: Date; title: string }>> {
  const client = await getCalendarClient();
  if (!client) return [];

  const res = await client.calendar.events.list({
    calendarId: client.calendarId,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items ?? []).map((e) => ({
    title: e.summary ?? "",
    start: new Date(e.start?.dateTime ?? e.start?.date ?? ""),
    end: new Date(e.end?.dateTime ?? e.end?.date ?? ""),
  }));
}
