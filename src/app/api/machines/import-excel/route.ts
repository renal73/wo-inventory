import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
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

        const rawId = getVal(['kodemesin', 'idmesin', 'id', 'kode']);
        const rawName = getVal(['namamesin', 'nama']);
        const rawArea = getVal(['area', 'lokasi']);
        const rawStatus = getVal(['status']);
        const rawDescription = getVal(['deskripsi', 'keterangan']);
        const rawPowerKw = getVal(['dayakw', 'powerkw', 'daya', 'power']);
        const rawAirPressure = getVal(['tekananudarabar', 'tekananudara', 'tekanan', 'airpressure']);

        if (!rawId || !rawName) {
          failedCount++;
          continue;
        }

        const machineId = String(rawId).toUpperCase().trim();
        const name = String(rawName).trim();
        const area = String(rawArea).trim() || null;
        let status = String(rawStatus).toUpperCase().trim();
        const description = String(rawDescription).trim() || null;

        // Parse power (kW → Watt) dan tekanan (bar)
        let powerWatt: number | null = null;
        if (rawPowerKw !== '' && rawPowerKw !== null && rawPowerKw !== undefined) {
          const kw = parseFloat(String(rawPowerKw));
          if (!isNaN(kw)) {
            powerWatt = Math.round(kw * 1000);
          }
        }

        let airPressureValue: number | null = null;
        if (rawAirPressure !== '' && rawAirPressure !== null && rawAirPressure !== undefined) {
          const bar = parseFloat(String(rawAirPressure));
          if (!isNaN(bar)) {
            airPressureValue = bar;
          }
        }

        // Default status jika kosong
        if (!status) {
          status = 'ACTIVE';
        }

        // 1. Validasi status
        if (status !== 'ACTIVE' && status !== 'MAINTENANCE' && status !== 'INACTIVE') {
          failedCount++;
          continue;
        }

        // 2. Validasi format Kode Mesin
        const utEqRegex = /^(UT|EQ)-[A-Z]{2}\/\d{3,4}$/;
        const isUtEq = machineId.startsWith('UT-') || machineId.startsWith('EQ-');

        if (isUtEq) {
          if (!utEqRegex.test(machineId)) {
            failedCount++;
            continue;
          }
        } else {
          if (machineId.length < 2) {
            failedCount++;
            continue;
          }
        }

        // 3. Upsert data ke database
        const existing = await tx.machine.findUnique({
          where: { id: machineId }
        });

        if (existing) {
          await tx.machine.update({
            where: { id: machineId },
            data: {
              name,
              area,
              status: status as any,
              description,
              powerWatt,
              airPressureValue,
              updatedAt: new Date()
            }
          });
          updatedCount++;
        } else {
          await tx.machine.create({
            data: {
              id: machineId,
              name,
              area,
              status: status as any,
              description,
              powerWatt,
              airPressureValue
            }
          });
          createdCount++;
        }
      }

      return { createdCount, updatedCount, failedCount };
    });

    return NextResponse.json({
      success: true,
      message: `Impor data mesin selesai. ${result.createdCount} mesin dibuat, ${result.updatedCount} mesin diperbarui, ${result.failedCount} mesin gagal.`
    });
  } catch (error) {
    console.error('Error POST /api/machines/import-excel:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengimpor Excel mesin' },
      { status: 500 }
    );
  }
}
