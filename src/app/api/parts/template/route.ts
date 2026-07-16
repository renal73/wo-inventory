import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Definisi header dan data contoh untuk template
    const headers = [
      'Part ID',
      'Nama Suku Cadang',
      'Kategori',
      'Stok Fisik',
      'Satuan',
      'Lokasi Rak',
      'Harga Satuan',
      'Vendor',
      'Deskripsi'
    ];

    const examples = [
      {
        'Part ID': 'EL-101',
        'Nama Suku Cadang': 'Sensor Proximity',
        'Kategori': 'Elektrik',
        'Stok Fisik': 10,
        'Satuan': 'unit',
        'Lokasi Rak': 'Rak A-04',
        'Harga Satuan': 450000,
        'Vendor': 'Autonics',
        'Deskripsi': 'Sensor kedekatan induktif untuk mixer'
      },
      {
        'Part ID': 'ME-101',
        'Nama Suku Cadang': 'Gearbox Mixer',
        'Kategori': 'Mekanik',
        'Stok Fisik': 2,
        'Satuan': 'pcs',
        'Lokasi Rak': 'Rak B-03',
        'Harga Satuan': 12500000,
        'Vendor': 'PT Gearbox Jaya',
        'Deskripsi': 'Gearbox transmisi rasio 1:50'
      }
    ];

    // Buat worksheet dari data contoh
    const worksheet = XLSX.utils.json_to_sheet(examples, { header: headers });
    
    // Buat workbook baru
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Barang');

    // Tulis workbook ke buffer biner
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Kembalikan response file biner
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_data_barang.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json(
      { message: 'Gagal membuat template Excel' },
      { status: 500 }
    );
  }
}
