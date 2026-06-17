import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Ambil top 5 transaksi masuk terbaru
    const inboundTransactions = await prisma.inboundTransaction.findMany({
      take: 5,
      orderBy: {
        date: 'desc'
      },
      include: {
        part: true,
        creator: true
      }
    });

    // Ambil top 5 transaksi keluar terbaru
    const outboundTransactions = await prisma.outboundTransaction.findMany({
      take: 5,
      orderBy: {
        date: 'desc'
      },
      include: {
        part: true,
        creator: true,
        machine: true,
        purpose: true
      }
    });
    
    // Gabungkan transaksi masuk
    const inbound = inboundTransactions.map(t => {
      return {
        id: t.id,
        type: 'INBOUND',
        date: t.date.toISOString(),
        userName: t.creator ? t.creator.name : 'Staf',
        description: `Menerima ${t.quantity} unit "${t.part ? t.part.name : t.partId}" dari ${t.vendor}`
      };
    });

    // Gabungkan transaksi keluar
    const outbound = outboundTransactions.map(t => {
      const machineText = t.machine ? ` pada ${t.machine.name}` : '';
      const purposeText = t.purpose ? ` untuk ${t.purpose.purpose}` : '';

      return {
        id: t.id,
        type: 'OUTBOUND',
        date: t.date.toISOString(),
        userName: t.creator ? t.creator.name : 'Teknisi',
        description: `Mengambil ${t.quantity} unit "${t.part ? t.part.name : t.partId}"${purposeText}${machineText}`
      };
    });

    // Gabungkan, urutkan tanggal terbaru, ambil top 5
    const activities = [...inbound, ...outbound]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error GET /api/dashboard/recent-activity:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat aktivitas terbaru' },
      { status: 500 }
    );
  }
}
