import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Daftar tujuan penggunaan
export async function GET() {
  try {
    const usagePurposes = await prisma.usagePurpose.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    return NextResponse.json(usagePurposes);
  } catch (error) {
    console.error('Error GET /api/purposes:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat tujuan penggunaan' },
      { status: 500 }
    );
  }
}

// POST: Buat tujuan baru (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { purpose } = body;

    if (!purpose) {
      return NextResponse.json(
        { message: 'Tujuan penggunaan wajib diisi' },
        { status: 400 }
      );
    }

    // Periksa keunikan
    const duplicate = await prisma.usagePurpose.findFirst({
      where: {
        purpose: {
          equals: purpose.trim(),
          mode: 'insensitive'
        }
      }
    });
    if (duplicate) {
      return NextResponse.json(
        { message: 'Tujuan penggunaan sudah terdaftar' },
        { status: 400 }
      );
    }

    const newPurpose = await prisma.usagePurpose.create({
      data: {
        purpose: purpose.trim(),
        isActive: true
      }
    });

    return NextResponse.json(newPurpose, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/purposes:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menambahkan tujuan penggunaan' },
      { status: 500 }
    );
  }
}
