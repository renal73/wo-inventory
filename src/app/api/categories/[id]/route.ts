import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT: Perbarui kategori (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json(
        { message: 'Kategori tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, icon } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Nama kategori wajib diisi' },
        { status: 400 }
      );
    }

    // Periksa keunikan nama kategori (kecuali dirinya sendiri)
    const duplicate = await prisma.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });
    if (duplicate) {
      return NextResponse.json(
        { message: 'Kategori dengan nama tersebut sudah ada' },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        icon: icon !== undefined ? icon : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error PUT /api/categories/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui kategori' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus kategori (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json(
        { message: 'Kategori tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi: Cegah hapus jika ada part yang menggunakan kategori ini
    const containsParts = await prisma.part.findFirst({
      where: { categoryId: id }
    });
    if (containsParts) {
      return NextResponse.json(
        { message: 'Tidak dapat menghapus kategori yang masih berisi suku cadang. Silakan pindahkan atau hapus suku cadang terlebih dahulu.' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });
  } catch (error) {
    console.error('Error DELETE /api/categories/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menghapus kategori' },
      { status: 500 }
    );
  }
}
