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

// PUT /api/notifications/[id] - Mark satu notifikasi sebagai sudah dibaca
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await (prisma as any).notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await (prisma as any).notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/notifications/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Hapus satu notifikasi
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await (prisma as any).notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await (prisma as any).notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/notifications/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}