import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Riwayat transaksi per part (masuk & keluar)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const part = await prisma.part.findUnique({
      where: { id }
    });
    if (!part) {
      return NextResponse.json(
        { message: 'Suku cadang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Ambil transaksi masuk
    const inboundTransactions = await prisma.inboundTransaction.findMany({
      where: { partId: id },
      include: {
        creator: true
      }
    });

    const inbound = inboundTransactions.map(t => {
      return {
        id: t.id,
        type: 'INBOUND' as const,
        quantity: t.quantity,
        price: t.price,
        vendor: t.vendor,
        createdBy: t.creator ? t.creator.name : 'User Tidak Diketahui',
        date: t.date.toISOString(),
        purpose: 'Pembelian Stok / Inbound',
        machine: null
      };
    });

    // Ambil transaksi keluar
    const outboundTransactions = await prisma.outboundTransaction.findMany({
      where: { partId: id },
      include: {
        creator: true,
        purpose: true,
        machine: true
      }
    });

    const outbound = outboundTransactions.map(t => {
      return {
        id: t.id,
        type: 'OUTBOUND' as const,
        quantity: t.quantity,
        price: part.price, // Outbound menggunakan harga rata-rata berjalan
        vendor: null,
        createdBy: t.creator ? t.creator.name : 'User Tidak Diketahui',
        date: t.date.toISOString(),
        purpose: t.purpose ? t.purpose.purpose : 'Tujuan Tidak Diketahui',
        machine: t.machine ? `${t.machine.name} (${t.machine.id})` : null
      };
    });

    // Gabungkan dan urutkan berdasarkan tanggal terbaru
    const history = [...inbound, ...outbound].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error GET /api/parts/[id]/history:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat riwayat transaksi' },
      { status: 500 }
    );
  }
}
