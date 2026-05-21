import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json() as unknown;
  const data = UpdateSchema.parse(body);

  const updateData: Record<string, string | undefined> = {};
  if (data.name) updateData.name = data.name;
  if (data.phone) updateData.phone = data.phone;

  if (data.newPassword) {
    if (!data.currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Cannot update password" }, { status: 400 });
    }
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(data.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
