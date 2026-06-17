import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PartType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Daftar part (elec + mech) yang terhubung ke mesin dengan stok real-time
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: machineId } = await params;
    
    // Cek apakah mesin ada
    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
    });
    if (!machine) {
      return NextResponse.json(
        { message: 'Mesin tidak ditemukan' },
        { status: 404 }
      );
    }

    const machineParts = await prisma.machinePart.findMany({
      where: { machineId },
      include: {
        part: true
      }
    });
    
    // Join dengan data real-time suku cadang
    const partsWithRealtimeStock = machineParts.map(mp => {
      const stock = mp.part ? mp.part.stock : 0;
      const minStockAlert = mp.part ? mp.part.minStockAlert : 0;

      // Logika Status Stok:
      // Kritis (🔴) jika stok < recommendedMinQty
      // Menipis (⚠️) jika stok >= recommendedMinQty tetapi stok <= recommendedMinQty * 1.5 ATAU stok <= minStockAlert
      // Cukup (✅) jika stok > recommendedMinQty
      let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
      if (stock < mp.recommendedMinQty) {
        status = 'CRITICAL';
      } else if (stock <= mp.recommendedMinQty * 1.5 || stock <= minStockAlert) {
        status = 'WARNING';
      }

      return {
        id: mp.id,
        partId: mp.partId,
        name: mp.part ? mp.part.name : 'Suku Cadang Dihapus',
        stock,
        recommendedMinQty: mp.recommendedMinQty,
        partType: mp.partType,
        notes: mp.notes,
        status,
        rackLocation: mp.part ? mp.part.rackLocation : '-'
      };
    });

    return NextResponse.json(partsWithRealtimeStock);
  } catch (error) {
    console.error('Error GET /api/machines/[id]/parts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat suku cadang mesin' },
      { status: 500 }
    );
  }
}

// POST: Hubungkan (Assign) part ke mesin (Admin only)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: machineId } = await params;
    
    // Cek apakah mesin ada
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
    const { partId, partType, recommendedMinQty, notes } = body;

    if (!partId || !partType || recommendedMinQty === undefined) {
      return NextResponse.json(
        { message: 'Kolom Suku Cadang, Tipe Part, dan Kuantitas Rekomendasi wajib diisi' },
        { status: 400 }
      );
    }

    if (partType !== 'ELECTRICAL' && partType !== 'MECHANICAL') {
      return NextResponse.json(
        { message: 'Tipe Part harus berupa ELECTRICAL atau MECHANICAL' },
        { status: 400 }
      );
    }

    // Cek apakah part ada di database
    const part = await prisma.part.findUnique({
      where: { id: partId }
    });
    if (!part) {
      return NextResponse.json(
        { message: 'Suku cadang yang dipilih tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek jika part sudah ter-assign ke mesin ini
    const alreadyAssigned = await prisma.machinePart.findFirst({
      where: {
        machineId,
        partId
      }
    });
    if (alreadyAssigned) {
      return NextResponse.json(
        { message: 'Suku cadang ini sudah dipetakan ke mesin ini' },
        { status: 409 } // Conflict
      );
    }

    const newMachinePart = await prisma.machinePart.create({
      data: {
        machineId,
        partId,
        partType: partType as PartType,
        recommendedMinQty: Number(recommendedMinQty) || 1,
        notes: notes ? notes.trim() : null
      }
    });

    return NextResponse.json(newMachinePart, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/machines/[id]/parts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memetakan suku cadang ke mesin' },
      { status: 500 }
    );
  }
}
