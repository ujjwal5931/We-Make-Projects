import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  billingFullName: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { billingAddress: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const v = profileSchema.safeParse(body);
  if (!v.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { name, phone, billingFullName, billingAddressLine1, billingAddressLine2, billingCity, billingState, billingPostalCode, billingCountry } = v.data;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  const user = await prisma.user.update({ where: { id: session.user.id }, data: updateData });
  if (billingFullName && billingAddressLine1 && billingCity && billingState && billingPostalCode) {
    await prisma.billingAddress.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, fullName: billingFullName, addressLine1: billingAddressLine1, addressLine2: billingAddressLine2, city: billingCity, state: billingState, postalCode: billingPostalCode, country: billingCountry || "India" },
      update: { fullName: billingFullName, addressLine1: billingAddressLine1, addressLine2: billingAddressLine2, city: billingCity, state: billingState, postalCode: billingPostalCode, country: billingCountry || "India" },
    });
  }
  return NextResponse.json({ success: true });
}
