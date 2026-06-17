import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const parts = await prisma.part.findMany({
      include: {
        category: true
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    // Header Kolom CSV
    const headers = [
      'Part ID',
      'Nama Suku Cadang',
      'Kategori',
      'Stok Fisik',
      'Lokasi Rak',
      'Harga Satuan (Rp)',
      'Total Nilai Aset (Rp)',
      'Vendor/Supplier'
    ];

    // Buat baris data
    const rows = parts.map(p => {
      const categoryName = p.category ? p.category.name : 'Tidak Diketahui';
      const totalAsset = p.stock * p.price;
      
      // Fungsi untuk escape karakter koma/kutip ganda di CSV
      const escape = (val: any) => {
        const str = String(val === null || val === undefined ? '' : val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escape(p.id),
        escape(p.name),
        escape(categoryName),
        escape(p.stock),
        escape(p.rackLocation || '-'),
        escape(p.price),
        escape(totalAsset),
        escape(p.vendor || '-')
      ];
    });

    // Satukan header dan baris dengan tanda baris baru (\r\n untuk CSV standar)
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    // Kembalikan response sebagai file download CSV dengan charset UTF-8 BOM agar Excel membukanya dengan benar
    const utf8Bom = '\uFEFF';
    return new NextResponse(utf8Bom + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=inventaris_suku_cadang.csv',
      },
    });
  } catch (error) {
    console.error('Error GET /api/parts/export/csv:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengekspor data CSV' },
      { status: 500 }
    );
  }
}
