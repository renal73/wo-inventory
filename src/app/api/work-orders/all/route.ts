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

export async function DELETE(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete all work orders
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    // Count before delete
    const countBefore = await prisma.workOrder.count();

    if (countBefore === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada work order untuk dihapus'
      });
    }

    // Delete in transaction to ensure all related records are deleted
    await prisma.$transaction(async (tx) => {
      // Delete work order parts first (related records)
      await tx.workOrderPart.deleteMany({});
      
      // Delete wo updates
      await tx.woUpdate.deleteMany({});
      
      // Delete all work orders
      await tx.workOrder.deleteMany({});
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${countBefore} work order beserta semua data terkait (riwayat update dan part yang diambil)`
    });
  } catch (error) {
    console.error('Error deleting all work orders:', error);
    return NextResponse.json({ error: 'Failed to delete work orders' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can check count
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const count = await prisma.workOrder.count();

    return NextResponse.json({
      count,
      message: `Terdapat ${count} work order dalam database`
    });
  } catch (error) {
    console.error('Error counting work orders:', error);
    return NextResponse.json({ error: 'Failed to count work orders' }, { status: 500 });
  }
}
