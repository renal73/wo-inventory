import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      include: {
        category: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    // Cari part yang stoknya kritis (stok <= minStockAlert)
    const lowStockParts = parts
      .filter(p => p.stock <= p.minStockAlert)
      .map(p => {
        return {
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStockAlert: p.minStockAlert,
          rackLocation: p.rackLocation || '-',
          categoryName: p.category ? p.category.name : 'Tidak Diketahui'
        };
      })
      .slice(0, 5); // Ambil 5 item teratas

    return NextResponse.json(lowStockParts);
  } catch (error) {
    console.error('Error GET /api/dashboard/low-stock:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat daftar stok menipis' },
      { status: 500 }
    );
  }
}
