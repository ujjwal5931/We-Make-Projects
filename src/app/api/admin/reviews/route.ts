import { NextRequest, NextResponse } from "next/server";
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
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip: (page - 1) * limit, take: limit,
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count(),
  ]);
  return NextResponse.json({ reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.review.delete({ where: { id } });
  await prisma.adminAuditLog.create({ data: { adminId: (session.user as any).id, action: "REVIEW_DELETED", entityType: "Review", entityId: id } });
  return NextResponse.json({ success: true });
}
