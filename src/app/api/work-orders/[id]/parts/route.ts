import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

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

// GET: Ambil daftar part yang sudah pernah diambil untuk WO tertentu
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const workOrderId = id;

    const partsTaken = await prisma.workOrderPart.findMany({
      where: { workOrderId },
      orderBy: { takenAt: 'desc' },
      include: {
        part: {
          select: {
            id: true,
            name: true,
            stock: true,
            rackLocation: true
          }
        },
        takenBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(partsTaken);
  } catch (error) {
    console.error('Error GET /api/work-orders/[id]/parts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts for this work order' },
      { status: 500 }
    );
  }
}

// POST: Ambil part dari inventory untuk work order tertentu
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const workOrderId = id;

    const body = await request.json();
    const { partId, qtyTaken, locationNotes } = body;

    // Validasi input
    if (!partId || !qtyTaken || !locationNotes) {
      return NextResponse.json(
        { error: 'partId, qtyTaken, dan locationNotes wajib diisi' },
        { status: 400 }
      );
    }

    if (qtyTaken <= 0) {
      return NextResponse.json(
        { error: 'Jumlah part harus lebih dari 0' },
        { status: 400 }
      );
    }

    // Cek apakah work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId }
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work Order tidak ditemukan' },
        { status: 404 }
      );
    }

    // Gunakan transaksi untuk atomic operation (mencegah race condition)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek stok part saat ini dengan lock
      const part = await tx.part.findUnique({
        where: { id: partId }
      });

      if (!part) {
        throw new Error('Part tidak ditemukan');
      }

      if (part.stock < qtyTaken) {
        throw new Error(`Stok tidak mencukupi. Stok tersedia: ${part.stock}`);
      }

      // 2. Kurangi stok inventory
      await tx.part.update({
        where: { id: partId },
        data: {
          stock: {
            decrement: qtyTaken
          }
        }
      });

      // 3. Catat pengambilan part
      const workOrderPart = await tx.workOrderPart.create({
        data: {
          workOrderId,
          partId,
          qtyTaken,
          takenById: user.id,
          locationNotes: locationNotes.trim()
        },
        include: {
          part: {
            select: {
              id: true,
              name: true,
              stock: true,
              rackLocation: true
            }
          },
          takenBy: {
            select: {
              id: true,
              name: true
            }
          },
          workOrder: {
            select: {
              id: true,
              woNumber: true
            }
          }
        }
      });

      // 4. Catat outbound transaction untuk audit trail
      // Cari atau buat default purpose untuk WO
      let purpose = await tx.usagePurpose.findFirst({
        where: { purpose: 'Work Order Maintenance' }
      });

      if (!purpose) {
        purpose = await tx.usagePurpose.create({
          data: {
            purpose: 'Work Order Maintenance',
            isActive: true
          }
        });
      }

      await tx.outboundTransaction.create({
        data: {
          partId,
          quantity: qtyTaken,
          purposeId: purpose.id,
          machineId: null, // Machine tidak wajib
          createdBy: user.id,
          date: new Date()
        }
      });

      return workOrderPart;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return NextResponse.json({
      success: true,
      message: 'Part berhasil diambil',
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error POST /api/work-orders/[id]/parts:', error);
    
    // Handle specific errors
    if (error.message.includes('Stok tidak mencukupi')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('tidak ditemukan')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal mengambil part' },
      { status: 500 }
    );
  }
}

// DELETE: Batalkan pengambilan part (restore stok)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partRecordId = searchParams.get('partRecordId');

    if (!partRecordId) {
      return NextResponse.json(
        { error: 'partRecordId wajib diisi' },
        { status: 400 }
      );
    }

    // Gunakan transaksi untuk atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek record part yang akan dibatalkan
      const record = await tx.workOrderPart.findUnique({
        where: { id: partRecordId }
      });

      if (!record) {
        throw new Error('Record pengambilan part tidak ditemukan');
      }

      // 2. Restore stok inventory
      await tx.part.update({
        where: { id: record.partId },
        data: {
          stock: {
            increment: record.qtyTaken
          }
        }
      });

      // 3. Hapus record pengambilan part
      await tx.workOrderPart.delete({
        where: { id: partRecordId }
      });

      return { success: true };
    });

    return NextResponse.json({
      success: true,
      message: 'Pengambilan part berhasil dibatalkan dan stok dikembalikan'
    });

  } catch (error: any) {
    console.error('Error DELETE /api/work-orders/[id]/parts:', error);
    
    if (error.message.includes('tidak ditemukan')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal membatalkan pengambilan part' },
      { status: 500 }
    );
  }
}
