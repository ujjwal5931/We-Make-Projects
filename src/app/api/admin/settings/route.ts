import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await prisma.storeSettings.findMany({ orderBy: { key: "asc" } });
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return NextResponse.json({ settings: map });
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.storeSettings.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
  await prisma.adminAuditLog.create({ data: { adminId: (session.user as any).id, action: "SETTINGS_UPDATED", entityType: "StoreSettings", entityId: "global", metadata: JSON.stringify(body) } });
  
  // Invalidate layout and page caches so the updated contact info reflects immediately in Footer and all pages
  revalidatePath("/", "layout");

  return NextResponse.json({ success: true });
}

