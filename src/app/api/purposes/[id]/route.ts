import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT: Perbarui tujuan penggunaan (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const purposeRecord = await prisma.usagePurpose.findUnique({
      where: { id }
    });

    if (!purposeRecord) {
      return NextResponse.json(
        { message: 'Tujuan penggunaan tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { purpose, isActive } = body;

    if (!purpose) {
      return NextResponse.json(
        { message: 'Tujuan penggunaan wajib diisi' },
        { status: 400 }
      );
    }

    // Periksa keunikan (kecuali dirinya sendiri)
    const duplicate = await prisma.usagePurpose.findFirst({
      where: {
        purpose: {
          equals: purpose.trim(),
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });
    if (duplicate) {
      return NextResponse.json(
        { message: 'Tujuan penggunaan sudah terdaftar' },
        { status: 400 }
      );
    }

    const updated = await prisma.usagePurpose.update({
      where: { id },
      data: {
        purpose: purpose.trim(),
        isActive: typeof isActive === 'boolean' ? isActive : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error PUT /api/purposes/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui tujuan penggunaan' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus tujuan penggunaan (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const purposeRecord = await prisma.usagePurpose.findUnique({
      where: { id }
    });

    if (!purposeRecord) {
      return NextResponse.json(
        { message: 'Tujuan penggunaan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi: Cegah hapus jika ada transaksi yang menggunakan tujuan penggunaan ini
    const isReferenced = await prisma.outboundTransaction.findFirst({
      where: { purposeId: id }
    });
    if (isReferenced) {
      return NextResponse.json(
        { message: 'Tidak dapat menghapus tujuan penggunaan yang sudah digunakan dalam riwayat transaksi. Nonaktifkan saja tujuan ini.' },
        { status: 400 }
      );
    }

    await prisma.usagePurpose.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Tujuan penggunaan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error DELETE /api/purposes/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menghapus tujuan penggunaan' },
      { status: 500 }
    );
  }
}
