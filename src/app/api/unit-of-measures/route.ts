import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Daftar semua satuan
export async function GET() {
  try {
    const units = await prisma.unitOfMeasure.findMany({
      include: {
        _count: {
          select: { parts: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error('Error GET /api/unit-of-measures:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat data satuan' },
      { status: 500 }
    );
  }
}

// POST: Tambah satuan baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, label } = body;

    if (!name || !label) {
      return NextResponse.json(
        { message: 'Nama dan Label satuan wajib diisi' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedLabel = label.trim();

    // Cek duplikat
    const existing = await prisma.unitOfMeasure.findUnique({
      where: { name: trimmedName }
    });
    if (existing) {
      return NextResponse.json(
        { message: `Satuan "${trimmedName}" sudah ada` },
        { status: 400 }
      );
    }

    const newUnit = await prisma.unitOfMeasure.create({
      data: {
        name: trimmedName,
        label: trimmedLabel
      }
    });

    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/unit-of-measures:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menambahkan satuan' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus satuan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'ID satuan wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah masih dipakai
    const unit = await prisma.unitOfMeasure.findUnique({
      where: { id },
      include: { _count: { select: { parts: true } } }
    });

    if (!unit) {
      return NextResponse.json(
        { message: 'Satuan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (unit._count.parts > 0) {
      return NextResponse.json(
        { message: `Satuan "${unit.name}" masih digunakan oleh ${unit._count.parts} part. Ubah satuan part terlebih dahulu sebelum menghapus.` },
        { status: 400 }
      );
    }

    await prisma.unitOfMeasure.delete({ where: { id } });

    return NextResponse.json({ message: `Satuan "${unit.name}" berhasil dihapus` });
  } catch (error) {
    console.error('Error DELETE /api/unit-of-measures:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menghapus satuan' },
      { status: 500 }
    );
  }
}