import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const data = rooms.map((room, idx) => ({
      'No': idx + 1,
      'Nama Ruangan': room.name,
      'Deskripsi': room.description || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 30 },  // Nama Ruangan
      { wch: 50 },  // Deskripsi
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Ruangan');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Master_Ruangan.xlsx"',
      },
    });
  } catch (error) {
    console.error('Failed to export rooms:', error);
    return NextResponse.json({ error: 'Gagal export ruangan' }, { status: 500 });
  }
}