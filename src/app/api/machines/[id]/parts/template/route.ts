import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: rawMachineId } = await params;
    const machineId = decodeURIComponent(rawMachineId).replace(/___/g, '/');

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

    const headers = [
      'Part ID',
      'Tipe Part',
      'Min Kuantitas Rekomendasi',
      'Catatan'
    ];

    const examples = [
      {
        'Part ID': 'EL-001',
        'Tipe Part': 'ELECTRICAL',
        'Min Kuantitas Rekomendasi': 2,
        'Catatan': 'Motor utama blower'
      },
      {
        'Part ID': 'ME-002',
        'Tipe Part': 'MECHANICAL',
        'Min Kuantitas Rekomendasi': 4,
        'Catatan': 'Bearing poros mixer'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(examples, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemetaan Part');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="template_pemetaan_part_${machineId}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating machine parts mapping Excel template:', error);
    return NextResponse.json(
      { message: 'Gagal membuat template Excel pemetaan suku cadang' },
      { status: 500 }
    );
  }
}
