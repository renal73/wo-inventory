import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'File Excel tidak ditemukan' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'File Excel kosong atau tidak memiliki baris data' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      for (const row of rows) {
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(
              rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, '')
            );
            if (foundKey) return row[foundKey];
          }
          return '';
        };

        const rawPartId = getVal(['partid', 'idsukucadang', 'id', 'kodebarang', 'part']);
        const rawPartType = getVal(['tipepart', 'tipe', 'type', 'parttype']);
        const rawMinQty = getVal(['minkuantitasrekomendasi', 'recommendedminqty', 'minqty', 'jumlah']);
        const rawNotes = getVal(['catatan', 'notes', 'keterangan']);

        if (!rawPartId) {
          failedCount++;
          continue;
        }

        const partId = String(rawPartId).toUpperCase().trim();
        const partType = String(rawPartType).toUpperCase().trim();
        const recommendedMinQty = Number(rawMinQty) || 1;
        const notes = String(rawNotes).trim() || null;

        // 1. Validasi partType
        if (partType !== 'ELECTRICAL' && partType !== 'MECHANICAL') {
          failedCount++;
          continue;
        }

        // 2. Validasi apakah Part ada di database
        const part = await tx.part.findUnique({
          where: { id: partId }
        });

        if (!part) {
          failedCount++;
          continue;
        }

        // 3. Upsert pemetaan suku cadang mesin
        const existing = await tx.machinePart.findUnique({
          where: {
            machineId_partId: {
              machineId,
              partId
            }
          }
        });

        if (existing) {
          await tx.machinePart.update({
            where: {
              machineId_partId: {
                machineId,
                partId
              }
            },
            data: {
              partType: partType as any,
              recommendedMinQty,
              notes
            }
          });
          updatedCount++;
        } else {
          await tx.machinePart.create({
            data: {
              machineId,
              partId,
              partType: partType as any,
              recommendedMinQty,
              notes
            }
          });
          createdCount++;
        }
      }

      return { createdCount, updatedCount, failedCount };
    });

    return NextResponse.json({
      success: true,
      message: `Impor pemetaan selesai. ${result.createdCount} item terhubung, ${result.updatedCount} item diperbarui, ${result.failedCount} item gagal.`
    });
  } catch (error) {
    console.error('Error POST /api/machines/[id]/parts/import-excel:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengimpor Excel pemetaan suku cadang' },
      { status: 500 }
    );
  }
}
