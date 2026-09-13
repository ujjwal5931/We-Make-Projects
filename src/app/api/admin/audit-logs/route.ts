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
  const limit = parseInt(searchParams.get("limit") || "30");
  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      skip: (page - 1) * limit, take: limit,
      include: { admin: { select: { name: true, userId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminAuditLog.count(),
  ]);
  return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
