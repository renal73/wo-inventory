import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decryptSession } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET: Ambil daftar transaksi keluar
export async function GET() {
  try {
    const transactions = await prisma.outboundTransaction.findMany({
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
        },
        purpose: {
          select: {
            purpose: true
          }
        },
        machine: {
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
        purposeId: t.purposeId,
        machineId: t.machineId,
        createdBy: t.creator ? t.creator.name : 'User Tidak Diketahui',
        date: t.date.toISOString(),
        partName: t.part ? t.part.name : 'Suku Cadang Dihapus',
        purposeName: t.purpose ? t.purpose.purpose : 'Tujuan Dihapus',
        machineName: t.machine ? t.machine.name : null
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error GET /api/transactions/outbound:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat transaksi keluar' },
      { status: 500 }
    );
  }
}

// POST: Catat barang keluar (Admin & User)
export async function POST(request: Request) {
  try {
    // Ambil sesi user saat ini untuk audit trail
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const sessionUser = token ? decryptSession(token) : null;
    const userId = sessionUser?.id || 'usr-user'; // fallback default ke user biasa

    const body = await request.json();
    const { partId, quantity, purposeId, machineId } = body;

    if (!partId || !quantity || !purposeId) {
      return NextResponse.json(
        { message: 'Kolom Suku Cadang, Jumlah Keluar, dan Tujuan Penggunaan wajib diisi' },
        { status: 400 }
      );
    }

    const qtyNum = Number(quantity);
    if (qtyNum <= 0) {
      return NextResponse.json(
        { message: 'Jumlah barang keluar harus bernilai lebih dari 0' },
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

        // Validasi ketersediaan stok
        if (part.stock < qtyNum) {
          throw new Error(`INSUFFICIENT_STOCK|${part.stock}`);
        }

        // Cek tujuan penggunaan ada
        const purpose = await tx.usagePurpose.findUnique({
          where: { id: purposeId }
        });
        if (!purpose) {
          throw new Error('PURPOSE_INVALID');
        }

        // Cek mesin ada (jika diberikan)
        if (machineId) {
          const machine = await tx.machine.findUnique({
            where: { id: machineId }
          });
          if (!machine) {
            throw new Error('MACHINE_INVALID');
          }
        }

        // Update stok part
        const updatedPart = await tx.part.update({
          where: { id: partId },
          data: {
            stock: part.stock - qtyNum
          }
        });

        // Buat record transaksi baru
        const newOutbound = await tx.outboundTransaction.create({
          data: {
            partId,
            quantity: qtyNum,
            purposeId,
            machineId: machineId || null,
            createdBy: userId
          }
        });

        return {
          transaction: {
            ...newOutbound,
            date: newOutbound.date.toISOString()
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
        message: 'Transaksi keluar berhasil dicatat. Stok suku cadang dikurangi.',
        transaction: result.transaction,
        part: result.part
      }, { status: 201 });

    } catch (txError: any) {
      if (txError.message === 'PART_NOT_FOUND') {
        return NextResponse.json(
          { message: 'Suku cadang tidak ditemukan' },
          { status: 404 }
        );
      }
      if (txError.message.startsWith('INSUFFICIENT_STOCK')) {
        const currentStock = txError.message.split('|')[1];
        return NextResponse.json(
          { message: `Stok tidak mencukupi. Stok saat ini: ${currentStock}, Jumlah diminta: ${qtyNum}` },
          { status: 400 }
        );
      }
      if (txError.message === 'PURPOSE_INVALID') {
        return NextResponse.json(
          { message: 'Tujuan penggunaan yang dipilih tidak valid' },
          { status: 400 }
        );
      }
      if (txError.message === 'MACHINE_INVALID') {
        return NextResponse.json(
          { message: 'Mesin yang dipilih tidak valid' },
          { status: 400 }
        );
      }
      throw txError;
    }

  } catch (error) {
    console.error('Error POST /api/transactions/outbound:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mencatat transaksi keluar' },
      { status: 500 }
    );
  }
}
