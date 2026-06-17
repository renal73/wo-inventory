import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const totalSKU = await prisma.part.count();

    const parts = await prisma.part.findMany({
      select: {
        stock: true,
        price: true,
        minStockAlert: true
      }
    });

    const totalAssetValue = parts.reduce(
      (sum, part) => sum + (part.stock * part.price), 
      0
    );

    const lowStockAlertCount = parts.filter(
      p => p.stock <= p.minStockAlert
    ).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const outboundTransactions = await prisma.outboundTransaction.findMany({
      where: {
        date: {
          gte: startOfMonth
        }
      },
      select: {
        quantity: true
      }
    });
    
    const monthlyOutboundQty = outboundTransactions.reduce((sum, t) => sum + t.quantity, 0);

    const totalMachines = await prisma.machine.count();

    return NextResponse.json({
      success: true,
      stats: {
        totalSKU,
        totalAssetValue,
        monthlyOutboundQty,
        lowStockAlertCount,
        totalMachines
      }
    });
  } catch (error) {
    console.error('Error GET /api/dashboard/stats:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat metrik dashboard' },
      { status: 500 }
    );
  }
}
