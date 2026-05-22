"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { MILESTONE_TEMPLATES } from "@/lib/wedding-planning";
import type {
  WeddingStatus,
  TaskStatus,
  VendorStatus,
  RSVPStatus,
} from "@prisma/client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

function path(id: string) {
  return `/admin/weddings/${id}`;
}

// ─── Wedding (overview) ──────────────────────────────────────────────────────

export async function updateWedding(weddingId: string, formData: FormData) {
  await requireAdmin();
  const data: Record<string, unknown> = {};
  for (const field of [
    "partner1Name",
    "partner2Name",
    "venue",
    "venueAddress",
    "packageType",
    "notes",
    "adminNotes",
  ] as const) {
    const v = formData.get(field);
    if (v != null) data[field] = String(v) || null;
  }
  const weddingDate = formData.get("weddingDate");
  if (weddingDate != null) {
    data.weddingDate = weddingDate ? new Date(String(weddingDate)) : null;
  }
  const ceremonyTime = formData.get("ceremonyTime");
  if (ceremonyTime != null) {
    data.ceremonyTime = ceremonyTime ? new Date(String(ceremonyTime)) : null;
  }
  const receptionTime = formData.get("receptionTime");
  if (receptionTime != null) {
    data.receptionTime = receptionTime ? new Date(String(receptionTime)) : null;
  }
  const guestCount = formData.get("guestCount");
  if (guestCount != null) data.guestCount = guestCount ? Number(guestCount) : null;
  const budgetTotal = formData.get("budgetTotal");
  if (budgetTotal != null) data.budgetTotal = budgetTotal ? Number(budgetTotal) : null;
  const status = formData.get("status");
  if (status) data.status = String(status) as WeddingStatus;

  await prisma.wedding.update({ where: { id: weddingId }, data });
  revalidatePath(path(weddingId));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function generateTimeline(weddingId: string) {
  await requireAdmin();
  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding) return;

  // Build a flat list of all template tasks; only set dueDate if we know the wedding date.
  const newTasks = MILESTONE_TEMPLATES.flatMap((m, mIdx) =>
    m.tasks.map((t, tIdx) => {
      let dueDate: Date | null = null;
      if (wedding.weddingDate) {
        const d = new Date(wedding.weddingDate);
        d.setMonth(d.getMonth() - m.monthsBefore);
        dueDate = d;
      }
      return {
        weddingId,
        title: t.title,
        category: t.category,
        milestone: m.key,
        dueDate,
        sortOrder: mIdx * 100 + tIdx,
        visibleToCouple: true,
      };
    }),
  );

  await prisma.weddingTask.createMany({ data: newTasks });
  revalidatePath(path(weddingId));
}

export async function addTask(weddingId: string, formData: FormData) {
  await requireAdmin();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;
  const category = (formData.get("category") as string) || null;
  const milestone = (formData.get("milestone") as string) || null;
  const dueDate = formData.get("dueDate") as string | null;
  const visibleToCouple = formData.get("visibleToCouple") === "on";

  await prisma.weddingTask.create({
    data: {
      weddingId,
      title,
      category,
      milestone,
      dueDate: dueDate ? new Date(dueDate) : null,
      visibleToCouple,
    },
  });
  revalidatePath(path(weddingId));
}

export async function updateTaskStatus(weddingId: string, taskId: string, status: TaskStatus) {
  await requireAdmin();
  await prisma.weddingTask.update({ where: { id: taskId }, data: { status } });
  revalidatePath(path(weddingId));
}

export async function deleteTask(weddingId: string, taskId: string) {
  await requireAdmin();
  await prisma.weddingTask.delete({ where: { id: taskId } });
  revalidatePath(path(weddingId));
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function addVendor(weddingId: string, formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  if (!name || !category) return;
  await prisma.weddingVendor.create({
    data: {
      weddingId,
      name,
      category,
      contact: (formData.get("contact") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      website: (formData.get("website") as string) || null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      deposit: formData.get("deposit") ? Number(formData.get("deposit")) : null,
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath(path(weddingId));
}

export async function updateVendorStatus(weddingId: string, vendorId: string, status: VendorStatus) {
  await requireAdmin();
  await prisma.weddingVendor.update({ where: { id: vendorId }, data: { status } });
  revalidatePath(path(weddingId));
}

export async function deleteVendor(weddingId: string, vendorId: string) {
  await requireAdmin();
  await prisma.weddingVendor.delete({ where: { id: vendorId } });
  revalidatePath(path(weddingId));
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export async function addBudgetItem(weddingId: string, formData: FormData) {
  await requireAdmin();
  const category = (formData.get("category") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const estimated = Number(formData.get("estimated"));
  if (!category || !description || !Number.isFinite(estimated)) return;
  await prisma.budgetItem.create({
    data: {
      weddingId,
      category,
      description,
      estimated,
      actual: formData.get("actual") ? Number(formData.get("actual")) : null,
      paid: formData.get("paid") ? Number(formData.get("paid")) : 0,
    },
  });
  revalidatePath(path(weddingId));
}

export async function deleteBudgetItem(weddingId: string, itemId: string) {
  await requireAdmin();
  await prisma.budgetItem.delete({ where: { id: itemId } });
  revalidatePath(path(weddingId));
}

// ─── Guests ──────────────────────────────────────────────────────────────────

export async function addGuest(weddingId: string, formData: FormData) {
  await requireAdmin();
  const firstName = (formData.get("firstName") as string)?.trim();
  if (!firstName) return;
  await prisma.guest.create({
    data: {
      weddingId,
      firstName,
      lastName: (formData.get("lastName") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      partyName: (formData.get("partyName") as string) || null,
      plusOne: formData.get("plusOne") === "on",
      dietary: (formData.get("dietary") as string) || null,
    },
  });
  revalidatePath(path(weddingId));
}

export async function updateGuestRsvp(weddingId: string, guestId: string, rsvp: RSVPStatus) {
  await requireAdmin();
  await prisma.guest.update({ where: { id: guestId }, data: { rsvp } });
  revalidatePath(path(weddingId));
}

export async function deleteGuest(weddingId: string, guestId: string) {
  await requireAdmin();
  await prisma.guest.delete({ where: { id: guestId } });
  revalidatePath(path(weddingId));
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function postMessage(weddingId: string, formData: FormData) {
  const session = await requireAdmin();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return;
  const body = (formData.get("body") as string)?.trim();
  if (!body) return;
  await prisma.weddingMessage.create({
    data: { weddingId, body, authorId: userId },
  });
  revalidatePath(path(weddingId));
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

export async function deleteWedding(weddingId: string) {
  await requireAdmin();
  await prisma.wedding.delete({ where: { id: weddingId } });
  redirect("/admin/weddings");
}
