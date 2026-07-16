import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

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

    // Only admin can export
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

    // CSV Headers
    const headers = [
      'ID',
      'Nama Tool',
      'Merk',
      'Stok',
      'PIC Username',
      'PIC Nama',
      'Tanggal Dibuat',
      'Tanggal Diperbarui'
    ];

    // Convert to CSV rows
    const rows = tools.map(tool => [
      tool.id,
      `"${(tool.name || '').replace(/"/g, '""')}"`,
      `"${(tool.brand || '').replace(/"/g, '""')}"`,
      tool.stock,
      tool.pic?.username || '',
      `"${(tool.pic?.name || '').replace(/"/g, '""')}"`,
      tool.createdAt ? new Date(tool.createdAt).toISOString() : '',
      tool.updatedAt ? new Date(tool.updatedAt).toISOString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `tools-export-${date}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tools:', error);
    return NextResponse.json({ error: 'Failed to export tools' }, { status: 500 });
  }
}
