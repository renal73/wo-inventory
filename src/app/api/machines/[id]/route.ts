import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MachineStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Detail satu mesin
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const machine = await prisma.machine.findUnique({
      where: { id }
    });

    if (!machine) {
      return NextResponse.json(
        { message: 'Mesin tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: machine.id,
      name: machine.name,
      description: machine.description,
      area: machine.area,
      status: machine.status,
      createdAt: machine.createdAt.toISOString(),
      updatedAt: machine.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error GET /api/machines/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat detail mesin' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data mesin (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const machine = await prisma.machine.findUnique({
      where: { id }
    });

    if (!machine) {
      return NextResponse.json(
        { message: 'Mesin tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, area, status } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Nama Mesin wajib diisi' },
        { status: 400 }
      );
    }

    if (status && status !== 'ACTIVE' && status !== 'MAINTENANCE' && status !== 'INACTIVE') {
      return NextResponse.json(
        { message: 'Status mesin tidak valid' },
        { status: 400 }
      );
    }

    const updatedMachine = await prisma.machine.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        area: area ? area.trim() : null,
        status: status as MachineStatus
      }
    });

    return NextResponse.json({
      id: updatedMachine.id,
      name: updatedMachine.name,
      description: updatedMachine.description,
      area: updatedMachine.area,
      status: updatedMachine.status,
      createdAt: updatedMachine.createdAt.toISOString(),
      updatedAt: updatedMachine.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error PUT /api/machines/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui data mesin' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus mesin & relasi part terkait (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const machine = await prisma.machine.findUnique({
      where: { id }
    });

    if (!machine) {
      return NextResponse.json(
        { message: 'Mesin tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cascade is handled in schema.prisma on relation delete
    await prisma.machine.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Mesin dan pemetaan suku cadang terkait berhasil dihapus'
    });
  } catch (error) {
    console.error('Error DELETE /api/machines/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menghapus mesin' },
      { status: 500 }
    );
  }
}
