import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string; partId: string }>;
}

// PUT: Perbarui data recommendedMinQty / notes pemetaan part ke mesin (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: rawMachineId, partId } = await params;
    const machineId = decodeURIComponent(rawMachineId).replace(/___/g, '/');
    
    const machinePart = await prisma.machinePart.findUnique({
      where: {
        machineId_partId: {
          machineId,
          partId
        }
      }
    });

    if (!machinePart) {
      return NextResponse.json(
        { message: 'Pemetaan suku cadang ke mesin ini tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { recommendedMinQty, notes } = body;

    if (recommendedMinQty === undefined) {
      return NextResponse.json(
        { message: 'Kuantitas rekomendasi wajib diisi' },
        { status: 400 }
      );
    }

    const updated = await prisma.machinePart.update({
      where: {
        machineId_partId: {
          machineId,
          partId
        }
      },
      data: {
        recommendedMinQty: Number(recommendedMinQty) || 1,
        notes: notes !== undefined ? notes.trim() : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error PUT /api/machines/[id]/parts/[partId]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui pemetaan suku cadang' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus pemetaan (Unassign) part dari mesin (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: rawMachineId, partId } = await params;
    const machineId = decodeURIComponent(rawMachineId).replace(/___/g, '/');
    
    const machinePart = await prisma.machinePart.findUnique({
      where: {
        machineId_partId: {
          machineId,
          partId
        }
      }
    });

    if (!machinePart) {
      return NextResponse.json(
        { message: 'Pemetaan suku cadang ke mesin ini tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.machinePart.delete({
      where: {
        machineId_partId: {
          machineId,
          partId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Suku cadang berhasil dilepas dari mesin'
    });
  } catch (error) {
    console.error('Error DELETE /api/machines/[id]/parts/[partId]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat melepaskan suku cadang dari mesin' },
      { status: 500 }
    );
  }
}
