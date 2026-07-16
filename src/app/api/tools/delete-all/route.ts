import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try {
    const payloadJson = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export async function DELETE() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete all tools
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    // First delete all borrow records (child records)
    await prisma.toolBorrowRecord.deleteMany({});
    
    // Then delete all tools
    const result = await prisma.tool.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${result.count} tools dan seluruh riwayat peminjaman.`
    });
  } catch (error) {
    console.error('Error deleting all tools:', error);
    return NextResponse.json({ error: 'Failed to delete tools' }, { status: 500 });
  }
}
