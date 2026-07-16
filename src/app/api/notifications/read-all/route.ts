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

// PUT /api/notifications/read-all - Mark semua notifikasi sebagai sudah dibaca
export async function PUT(_request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await (prisma as any).notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/notifications/read-all]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}