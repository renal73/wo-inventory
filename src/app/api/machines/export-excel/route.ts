import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try {
    const payloadJson = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const machines = await prisma.machine.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Build rows for Excel
    const rows = machines.map((machine) => ({
      'Kode Mesin': machine.id,
      'Nama Mesin': machine.name,
      'Deskripsi': machine.description || '',
      'Area / Lokasi': machine.area || '',
      'Status': machine.status,
      'Tipe Mesin': machine.machineType || '',
      'Manufacturer': machine.manufacturer || '',
      'Daya (kW)': machine.powerWatt ? (machine.powerWatt / 1000).toFixed(1) : '',
      'Tekanan Udara (bar)': machine.airPressureValue || '',
      'Tanggal Dibuat': machine.createdAt ? new Date(machine.createdAt).toISOString() : '',
      'Tanggal Diperbarui': machine.updatedAt ? new Date(machine.updatedAt).toISOString() : '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 14 },  // Kode Mesin
      { wch: 25 },  // Nama Mesin
      { wch: 30 },  // Deskripsi
      { wch: 20 },  // Area / Lokasi
      { wch: 14 },  // Status
      { wch: 18 },  // Tipe Mesin
      { wch: 18 },  // Manufacturer
      { wch: 10 },  // Daya (kW)
      { wch: 18 },  // Tekanan Udara (bar)
      { wch: 22 },  // Tanggal Dibuat
      { wch: 22 },  // Tanggal Diperbarui
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mesin');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().split('T')[0];
    const filename = `mesin-export-${date}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting machines to Excel:', error);
    return NextResponse.json({ error: 'Failed to export machines' }, { status: 500 });
  }
}