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

    const tools = await prisma.tool.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        pic: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Build rows for Excel
    const rows = tools.map(tool => ({
      'ID': tool.id,
      'Nama Tool': tool.name,
      'Merk': tool.brand || '',
      'Stok': tool.stock,
      'PIC Username': tool.pic?.username || '',
      'PIC Nama': tool.pic?.name || '',
      'Tanggal Dibuat': tool.createdAt ? new Date(tool.createdAt).toISOString() : '',
      'Tanggal Diperbarui': tool.updatedAt ? new Date(tool.updatedAt).toISOString() : '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },   // ID
      { wch: 25 },  // Nama Tool
      { wch: 20 },  // Merk
      { wch: 8 },   // Stok
      { wch: 16 },  // PIC Username
      { wch: 20 },  // PIC Nama
      { wch: 22 },  // Tanggal Dibuat
      { wch: 22 },  // Tanggal Diperbarui
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tools');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().split('T')[0];
    const filename = `tools-export-${date}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tools to Excel:', error);
    return NextResponse.json({ error: 'Failed to export tools' }, { status: 500 });
  }
}