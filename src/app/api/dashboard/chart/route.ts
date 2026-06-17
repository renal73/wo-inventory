import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 3m, 6m, 1y, all

    const now = new Date();
    
    // We compute the threshold date to retrieve only necessary records from DB
    let thresholdDate = new Date();
    if (range === '7d') {
      thresholdDate.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      thresholdDate.setDate(now.getDate() - 30);
    } else {
      const limitMonth = range === '3m' ? 3 : range === '6m' ? 6 : 12;
      thresholdDate = new Date(now.getFullYear(), now.getMonth() - limitMonth, 1);
    }
    thresholdDate.setHours(0, 0, 0, 0);

    // Fetch transactions
    const inboundTransactions = await prisma.inboundTransaction.findMany({
      where: {
        date: {
          gte: thresholdDate
        }
      },
      select: {
        date: true,
        quantity: true
      }
    });

    const outboundTransactions = await prisma.outboundTransaction.findMany({
      where: {
        date: {
          gte: thresholdDate
        }
      },
      select: {
        date: true,
        quantity: true
      }
    });

    const chartData: { name: string; masuk: number; keluar: number }[] = [];

    if (range === '7d') {
      // Kelompokkan 7 hari terakhir secara harian
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayString = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const inboundQty = inboundTransactions
          .filter(t => isSameDay(t.date, d))
          .reduce((sum, t) => sum + t.quantity, 0);

        const outboundQty = outboundTransactions
          .filter(t => isSameDay(t.date, d))
          .reduce((sum, t) => sum + t.quantity, 0);

        chartData.push({ name: dayString, masuk: inboundQty, keluar: outboundQty });
      }
    } else if (range === '30d') {
      // Kelompokkan 30 hari terakhir secara harian
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayString = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const inboundQty = inboundTransactions
          .filter(t => isSameDay(t.date, d))
          .reduce((sum, t) => sum + t.quantity, 0);

        const outboundQty = outboundTransactions
          .filter(t => isSameDay(t.date, d))
          .reduce((sum, t) => sum + t.quantity, 0);

        chartData.push({ name: dayString, masuk: inboundQty, keluar: outboundQty });
      }
    } else {
      // Kelompokkan berdasarkan bulan (untuk 3m, 6m, 1y, all)
      const bulanArray = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      
      const limitMonth = range === '3m' ? 3 : range === '6m' ? 6 : 12;

      for (let i = limitMonth - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${bulanArray[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

        const inboundQty = inboundTransactions
          .filter(t => isSameMonth(t.date, d))
          .reduce((sum, t) => sum + t.quantity, 0);

        const outboundQty = outboundTransactions
          .filter(t => isSameMonth(t.date, d))
          .reduce((sum, t) => sum + t.quantity, 0);

        chartData.push({ name: label, masuk: inboundQty, keluar: outboundQty });
      }
    }

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error GET /api/dashboard/chart:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat grafik tren' },
      { status: 500 }
    );
  }
}

// Helper untuk menyamakan hari
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Helper untuk menyamakan bulan
function isSameMonth(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}
