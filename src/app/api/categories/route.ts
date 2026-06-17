import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Daftar semua kategori + jumlah part ter-assign
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { parts: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const categoriesWithCount = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      createdAt: cat.createdAt.toISOString(),
      partCount: cat._count.parts
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('Error GET /api/categories:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat kategori' },
      { status: 500 }
    );
  }
}

// POST: Buat kategori baru (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Nama kategori wajib diisi' },
        { status: 400 }
      );
    }

    // Periksa keunikan nama kategori
    const duplicate = await prisma.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
    if (duplicate) {
      return NextResponse.json(
        { message: 'Kategori dengan nama tersebut sudah ada' },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || 'Package',
      }
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/categories:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menambahkan kategori' },
      { status: 500 }
    );
  }
}
