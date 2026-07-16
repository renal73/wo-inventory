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
    const machineId = decodeURIComponent(id).replace(/___/g, '/');
    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
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
      // Field baru
      machineType: machine.machineType,
      manufacturer: machine.manufacturer,
      powerWatt: machine.powerWatt,
      airPressureValue: machine.airPressureValue,
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
    const machineId = decodeURIComponent(id).replace(/___/g, '/');

    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
    });

    if (!machine) {
      return NextResponse.json(
        { message: 'Mesin tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, area, status, machineType, manufacturer, powerWatt, airPressureValue } = body;

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

    // Validasi powerWatt harus positif jika diberikan
    if (powerWatt !== undefined && powerWatt !== null && powerWatt < 0) {
      return NextResponse.json(
        { message: 'Power (Watt) harus angka positif' },
        { status: 400 }
      );
    }

    // Validasi airPressureValue harus positif jika diberikan
    if (airPressureValue !== undefined && airPressureValue !== null && airPressureValue < 0) {
      return NextResponse.json(
        { message: 'Tekanan udara harus angka positif' },
        { status: 400 }
      );
    }

    const updatedMachine = await prisma.machine.update({
      where: { id: machineId },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        area: area ? area.trim() : null,
        status: status as MachineStatus,
        // Field baru
        machineType: machineType !== undefined ? (machineType ? machineType.trim() : null) : machine.machineType,
        manufacturer: manufacturer !== undefined ? (manufacturer ? manufacturer.trim() : null) : machine.manufacturer,
        powerWatt: powerWatt !== undefined ? (powerWatt ? parseInt(powerWatt) : null) : machine.powerWatt,
        airPressureValue: airPressureValue !== undefined ? (airPressureValue !== null ? parseFloat(airPressureValue) : null) : machine.airPressureValue,
      }
    });

    return NextResponse.json({
      id: updatedMachine.id,
      name: updatedMachine.name,
      description: updatedMachine.description,
      area: updatedMachine.area,
      status: updatedMachine.status,
      // Field baru
      machineType: updatedMachine.machineType,
      manufacturer: updatedMachine.manufacturer,
      powerWatt: updatedMachine.powerWatt,
      airPressureValue: updatedMachine.airPressureValue,
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
    const machineId = decodeURIComponent(id).replace(/___/g, '/');

    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
    });

    if (!machine) {
      return NextResponse.json(
        { message: 'Mesin tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cascade is handled in schema.prisma on relation delete
    await prisma.machine.delete({
      where: { id: machineId }
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
