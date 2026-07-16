import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [total, active, maintenance, inactive, woTotal] = await Promise.all([
      prisma.machine.count(),
      prisma.machine.count({ where: { status: 'ACTIVE' } }),
      prisma.machine.count({ where: { status: 'MAINTENANCE' } }),
      prisma.machine.count({ where: { status: 'INACTIVE' } }),
      prisma.workOrder.count(),
    ]);

    return NextResponse.json({
      total,
      active,
      maintenance,
      inactive,
      workOrders: woTotal,
    });
  } catch (error) {
    console.error('Error GET /api/machines/stats:', error);
    return NextResponse.json(
      { message: 'Gagal memuat statistik mesin' },
      { status: 500 }
    );
  }
}