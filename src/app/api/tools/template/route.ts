import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can download template
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    // Check for Excel format
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';

    // Sample data
    const sampleData = [
      { name: 'Gerinda Listrik', brand: 'Bosch', stock: 5, picUsername: 'admin' },
      { name: 'Obeng Set', brand: 'Stanley', stock: 10, picUsername: '' },
      { name: 'Kunci Pas 17mm', brand: 'KRISHI', stock: 3, picUsername: '' },
    ];

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);

      worksheet['!cols'] = [
        { wch: 20 },  // name
        { wch: 15 },  // brand
        { wch: 8 },   // stock
        { wch: 16 },  // picUsername
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tools');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="tools-import-template.xlsx"',
        },
      });
    }

    // CSV Template (default)
    const headers = ['name', 'brand', 'stock', 'picUsername'];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => [row.name, row.brand, row.stock, row.picUsername].map(cell => {
        if (cell === '') return '';
        return isNaN(Number(cell)) ? `"${cell}"` : cell;
      }).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="tools-import-template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating tools template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
