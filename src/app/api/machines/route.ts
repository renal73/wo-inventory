import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MachineStatus } from '@prisma/client';

// GET: Daftar mesin dengan filter & ringkasan part + warning
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.toLowerCase() || '';
    const area = searchParams.get('area') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};

    // Filter Pencarian (ID/Kode, Nama)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter Area/Lokasi
    if (area) {
      where.area = area;
    }

    // Filter Status
    if (status) {
      where.status = status as MachineStatus;
    }

    // Enrich dengan ringkasan part & peringatan stok
    const machines = await prisma.machine.findMany({
      where,
      include: {
        machineParts: {
          include: {
            part: {
              select: {
                stock: true
              }
            }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    const machinesWithSummary = machines.map(m => {
      const electricalCount = m.machineParts.filter(mp => mp.partType === 'ELECTRICAL').length;
      const mechanicalCount = m.machineParts.filter(mp => mp.partType === 'MECHANICAL').length;

      // Periksa apakah ada part kritis (stok fisik part di bawah recommendedMinQty)
      let hasCriticalAlert = false;
      for (const mp of m.machineParts) {
        if (mp.part && mp.part.stock < mp.recommendedMinQty) {
          hasCriticalAlert = true;
          break;
        }
      }

      return {
        id: m.id,
        name: m.name,
        description: m.description,
        area: m.area,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        electricalCount,
        mechanicalCount,
        hasCriticalAlert
      };
    });

    return NextResponse.json(machinesWithSummary);
  } catch (error) {
    console.error('Error GET /api/machines:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat data mesin' },
      { status: 500 }
    );
  }
}

// POST: Tambah mesin baru (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, area, status } = body;

    if (!id || !name) {
      return NextResponse.json(
        { message: 'Kode Mesin dan Nama Mesin wajib diisi' },
        { status: 400 }
      );
    }

    if (status && status !== 'ACTIVE' && status !== 'MAINTENANCE' && status !== 'INACTIVE') {
      return NextResponse.json(
        { message: 'Status mesin tidak valid' },
        { status: 400 }
      );
    }
    // Validasi format Kode Mesin: UT-ab/000, EQ-ab/000, atau NA/Null (Bebas)
    const utEqRegex = /^(UT|EQ)-[A-Z]{2}\/\d{3,4}$/;
    const isUtEq = id.startsWith('UT-') || id.startsWith('EQ-');

    if (isUtEq) {
      if (!utEqRegex.test(id)) {
        return NextResponse.json(
          { message: 'Format Kode Mesin tidak valid. Contoh format: UT-EL/001 atau EQ-ME/0002 (Prefix UT- atau EQ-, diikuti 2 huruf kategori, slash (/), dan 3 atau 4 angka)' },
          { status: 400 }
        );
      }
    } else {
      // Pilihan NA/Null (Bebas) minimal 2 karakter
      if (id.length < 2) {
        return NextResponse.json(
          { message: 'Kode mesin minimal terdiri dari 2 karakter (Contoh: NA)' },
          { status: 400 }
        );
      }
    }

    // Periksa keunikan Kode Mesin
    const duplicate = await prisma.machine.findFirst({
      where: {
        id: {
          equals: id.toUpperCase().trim(),
          mode: 'insensitive'
        }
      }
    });
    if (duplicate) {
      return NextResponse.json(
        { message: `Mesin dengan kode ${id} sudah terdaftar` },
        { status: 400 }
      );
    }

    const newMachine = await prisma.machine.create({
      data: {
        id: id.toUpperCase().trim(),
        name: name.trim(),
        description: description ? description.trim() : null,
        area: area ? area.trim() : null,
        status: (status || 'ACTIVE') as MachineStatus
      }
    });

    return NextResponse.json(newMachine, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/machines:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat membuat mesin baru' },
      { status: 500 }
    );
  }
}
