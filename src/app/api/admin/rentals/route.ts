import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

function isAdmin(session: Session | null) {
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

const RentalSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().nullish(),
  description: z.string().min(1),
  longDesc: z.string().nullish(),
  price: z.number().positive(),
  depositPct: z.number().int().min(0).max(100).default(50),
  category: z.string().default("general"),
  images: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  dimensions: z.string().nullish(),
  capacity: z.string().nullish(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  metaTitle: z.string().nullish(),
  metaDesc: z.string().nullish(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rentals = await prisma.rentalItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { bookingItems: true } } },
  });

  return NextResponse.json(rentals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as unknown;
  const data = RentalSchema.parse(body);

  const slug = slugify(data.name);

  const rental = await prisma.rentalItem.create({
    data: {
      ...data,
      slug,
      price: data.price,
    },
  });

  return NextResponse.json(rental, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json() as unknown;
  const data = RentalSchema.partial().parse(body);

  const rental = await prisma.rentalItem.update({
    where: { id },
    data,
  });

  return NextResponse.json(rental);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Soft delete
  await prisma.rentalItem.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
