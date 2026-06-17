import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decryptSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Ambil daftar transaksi masuk
export async function GET() {
  try {
    const transactions = await prisma.inboundTransaction.findMany({
      include: {
        part: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const mapped = transactions.map(t => {
      return {
        id: t.id,
        partId: t.partId,
        quantity: t.quantity,
        price: t.price,
        vendor: t.vendor,
        createdBy: t.creator ? t.creator.name : 'User Tidak Diketahui',
        date: t.date.toISOString(),
        partName: t.part ? t.part.name : 'Suku Cadang Dihapus'
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error GET /api/transactions/inbound:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat transaksi masuk' },
      { status: 500 }
    );
  }
}

// POST: Catat barang masuk (Admin only)
export async function POST(request: Request) {
  try {
    // Ambil sesi user saat ini untuk audit trail
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const sessionUser = token ? decryptSession(token) : null;
    const userId = sessionUser?.id || 'usr-admin'; // fallback default

    const body = await request.json();
    const { partId, quantity, price, vendor } = body;

    if (!partId || !quantity || !price || !vendor) {
      return NextResponse.json(
        { message: 'Kolom Part ID, Jumlah Masuk, Harga Satuan, dan Vendor wajib diisi' },
        { status: 400 }
      );
    }

    const qtyNum = Number(quantity);
    const priceNum = Number(price);

    if (qtyNum <= 0 || priceNum <= 0) {
      return NextResponse.json(
        { message: 'Jumlah barang dan harga harus bernilai lebih dari 0' },
        { status: 400 }
      );
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Cari part di database
        const part = await tx.part.findUnique({
          where: { id: partId }
        });

        if (!part) {
          throw new Error('PART_NOT_FOUND');
        }

        const oldStock = part.stock;
        const oldPrice = part.price;
        const newStock = oldStock + qtyNum;
        
        // Kalkulasi harga rata-rata tertimbang (weighted average price)
        let newPrice = oldPrice;
        if (newStock > 0) {
          newPrice = Math.round((((oldStock * oldPrice) + (qtyNum * priceNum)) / newStock) * 100) / 100;
        } else {
          newPrice = priceNum;
        }

        // Update data part
        const updatedPart = await tx.part.update({
          where: { id: partId },
          data: {
            stock: newStock,
            price: newPrice
          }
        });

        // Buat record transaksi baru
        const newInbound = await tx.inboundTransaction.create({
          data: {
            partId,
            quantity: qtyNum,
            price: priceNum,
            vendor: vendor.trim(),
            createdBy: userId
          }
        });

        return {
          transaction: {
            ...newInbound,
            date: newInbound.date.toISOString()
          },
          part: {
            ...updatedPart,
            createdAt: updatedPart.createdAt.toISOString(),
            updatedAt: updatedPart.updatedAt.toISOString()
          }
        };
      });

      return NextResponse.json({
        success: true,
        message: 'Transaksi masuk berhasil dicatat. Stok dan harga rata-rata diperbarui.',
        transaction: result.transaction,
        part: result.part
      }, { status: 201 });

    } catch (txError: any) {
      if (txError.message === 'PART_NOT_FOUND') {
        return NextResponse.json(
          { message: `Suku cadang dengan ID ${partId} belum terdaftar. Daftarkan suku cadang terlebih dahulu di Data Barang.` },
          { status: 404 }
        );
      }
      throw txError;
    }

  } catch (error) {
    console.error('Error POST /api/transactions/inbound:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mencatat transaksi masuk' },
      { status: 500 }
    );
  }
}
