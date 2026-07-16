import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Daftar suku cadang dengan pencarian, filter, dan status mesin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.toLowerCase() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const rackLocation = searchParams.get('rackLocation') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const hasMachine = searchParams.get('hasMachine') === 'true';

    const where: any = {};

    // Filter Pencarian (ID, Nama, Deskripsi)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter Kategori
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter Lokasi Rak
    if (rackLocation) {
      where.rackLocation = {
        equals: rackLocation,
        mode: 'insensitive'
      };
    }

    const parts = await prisma.part.findMany({
      where,
      include: {
        category: true,
        unitOfMeasure: true,
        machineParts: {
          include: {
            machine: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    let filteredParts = parts;

    // Filter Stok Menipis (stok <= minStockAlert)
    if (lowStock) {
      filteredParts = filteredParts.filter(p => p.stock <= p.minStockAlert);
    }

    // Filter "Dipakai di Mesin" (terhubung minimal ke 1 mesin)
    if (hasMachine) {
      filteredParts = filteredParts.filter(p => p.machineParts.length > 0);
    }

    // Join data kategori & hitung pemakaian di mesin untuk UI
    const partsWithDetails = filteredParts.map(p => {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        stock: p.stock,
        minStockAlert: p.minStockAlert,
        price: p.price,
        rackLocation: p.rackLocation,
        vendor: p.vendor,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        category: p.category ? {
          id: p.category.id,
          name: p.category.name,
          icon: p.category.icon,
          createdAt: p.category.createdAt.toISOString()
        } : null,
        unitOfMeasure: p.unitOfMeasure ? {
          id: p.unitOfMeasure.id,
          name: p.unitOfMeasure.name,
          label: p.unitOfMeasure.label
        } : null,
        machineCount: p.machineParts.length,
        isLowStock: p.stock <= p.minStockAlert,
        machines: p.machineParts.map(mr => ({
          id: mr.machineId,
          name: mr.machine ? mr.machine.name : 'Mesin Tidak Diketahui',
          recommendedMinQty: mr.recommendedMinQty
        }))
      };
    });

    return NextResponse.json(partsWithDetails);
  } catch (error) {
    console.error('Error GET /api/parts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat data suku cadang' },
      { status: 500 }
    );
  }
}

// POST: Registrasi suku cadang baru (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, categoryId, unitOfMeasureId, minStockAlert, price, rackLocation, vendor } = body;

    // Validasi input wajib
    if (!id || !name || !categoryId) {
      return NextResponse.json(
        { message: 'Kolom Part ID, Nama Suku Cadang, dan Kategori wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi format Part ID (4 huruf diikuti 4 angka, misal: ABCD1234)
    const idRegex = /^[A-Za-z]{5}\d{4}$/;
    if (!idRegex.test(id)) {
      return NextResponse.json(
        { message: 'Format Part ID tidak valid. Harus terdiri dari 4 huruf diikuti 4 angka (contoh: ABCDE1234).' },
        { status: 400 }
      );
    }

    // Cek apakah Part ID sudah digunakan
    const duplicate = await prisma.part.findUnique({
      where: { id: id.toUpperCase().trim() }
    });
    if (duplicate) {
      return NextResponse.json(
        { message: `Suku cadang dengan Part ID ${id} sudah terdaftar` },
        { status: 400 }
      );
    }

    // Cek apakah kategori ada
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!categoryExists) {
      return NextResponse.json(
        { message: 'Kategori yang dipilih tidak valid' },
        { status: 400 }
      );
    }

    const newPart = await prisma.part.create({
      data: {
        id: id.toUpperCase().trim(),
        name: name.trim(),
        description: description ? description.trim() : null,
        categoryId,
        stock: 0, // Registrasi baru selalu memiliki stok awal 0 (stok bertambah via Inbound)
        unitOfMeasureId: unitOfMeasureId || null,
        minStockAlert: Number(minStockAlert) || 5,
        price: Number(price) || 0,
        rackLocation: rackLocation ? rackLocation.trim() : null,
        vendor: vendor ? vendor.trim() : null
      }
    });

    return NextResponse.json({
      id: newPart.id,
      name: newPart.name,
      description: newPart.description,
      categoryId: newPart.categoryId,
      stock: newPart.stock,
      minStockAlert: newPart.minStockAlert,
      price: newPart.price,
      rackLocation: newPart.rackLocation,
      vendor: newPart.vendor,
      createdAt: newPart.createdAt.toISOString(),
      updatedAt: newPart.updatedAt.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/parts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menambahkan suku cadang' },
      { status: 500 }
    );
  }
}
