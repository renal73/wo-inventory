import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Detail satu part + daftar mesin yang menggunakan
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        unitOfMeasure: true,
        machineParts: {
          include: {
            machine: true
          }
        }
      }
    });

    if (!part) {
      return NextResponse.json(
        { message: 'Suku cadang tidak ditemukan' },
        { status: 404 }
      );
    }

    const machines = part.machineParts.map(mr => ({
      id: mr.machineId,
      name: mr.machine ? mr.machine.name : 'Mesin Tidak Diketahui',
      area: mr.machine ? mr.machine.area || '' : '',
      status: mr.machine ? mr.machine.status : 'INACTIVE',
      partType: mr.partType,
      recommendedMinQty: mr.recommendedMinQty,
      notes: mr.notes
    }));

    return NextResponse.json({
      id: part.id,
      name: part.name,
      description: part.description,
      categoryId: part.categoryId,
      stock: part.stock,
      minStockAlert: part.minStockAlert,
      price: part.price,
      rackLocation: part.rackLocation,
      vendor: part.vendor,
      createdAt: part.createdAt.toISOString(),
      updatedAt: part.updatedAt.toISOString(),
      category: part.category ? {
        id: part.category.id,
        name: part.category.name,
        icon: part.category.icon,
        createdAt: part.category.createdAt.toISOString()
      } : null,
      unitOfMeasure: part.unitOfMeasure ? {
        id: part.unitOfMeasure.id,
        name: part.unitOfMeasure.name,
        label: part.unitOfMeasure.label
      } : null,
      machines
    });
  } catch (error) {
    console.error('Error GET /api/parts/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat detail suku cadang' },
      { status: 500 }
    );
  }
}

// PUT: Update part (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const part = await prisma.part.findUnique({
      where: { id }
    });

    if (!part) {
      return NextResponse.json(
        { message: 'Suku cadang tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, categoryId, unitOfMeasureId, minStockAlert, rackLocation, vendor } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { message: 'Nama dan Kategori wajib diisi' },
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

    const updated = await prisma.part.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        categoryId,
        unitOfMeasureId: unitOfMeasureId || null,
        minStockAlert: Number(minStockAlert) || 5,
        rackLocation: rackLocation ? rackLocation.trim() : null,
        vendor: vendor ? vendor.trim() : null
      }
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      categoryId: updated.categoryId,
      stock: updated.stock,
      minStockAlert: updated.minStockAlert,
      price: updated.price,
      rackLocation: updated.rackLocation,
      vendor: updated.vendor,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error PUT /api/parts/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui suku cadang' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus part (cascade hapus relasi mesin) (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const part = await prisma.part.findUnique({
      where: { id }
    });

    if (!part) {
      return NextResponse.json(
        { message: 'Suku cadang tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cascade is handled in schema.prisma
    await prisma.part.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Suku cadang dan pemetaan mesin terkait berhasil dihapus'
    });
  } catch (error) {
    console.error('Error DELETE /api/parts/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menghapus suku cadang' },
      { status: 500 }
    );
  }
}
