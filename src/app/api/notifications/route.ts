import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) return null;
  try {
    const payloadJson = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

// GET /api/notifications - Ambil notifikasi untuk user saat ini
export async function GET(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "unread" | "read" | null (all)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };
    if (filter === "unread") where.isRead = false;
    if (filter === "read") where.isRead = true;

    const [notifications, total, unreadCount] = await Promise.all([
      (prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).notification.count({ where }),
      (prisma as any).notification.count({ where: { userId, isRead: false } }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}