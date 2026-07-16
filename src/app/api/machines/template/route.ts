import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const headers = [
      'Kode Mesin',
      'Nama Mesin',
      'Area',
      'Status',
      'Deskripsi',
      'Daya (kW)',
      'Tekanan Udara (bar)'
    ];

    const examples = [
      {
        'Kode Mesin': 'UT-EL/001',
        'Nama Mesin': 'Genset Utama Utility',
        'Area': 'Utility Gedung B',
        'Status': 'ACTIVE',
        'Deskripsi': 'Genset penyuplai listrik cadangan area produksi',
        'Daya (kW)': 7500,
        'Tekanan Udara (bar)': null
      },
      {
        'Kode Mesin': 'EQ-ME/002',
        'Nama Mesin': 'Mesin Tablet Coating A',
        'Area': 'Produksi Lantai 1',
        'Status': 'MAINTENANCE',
        'Deskripsi': 'Mesin coating kapasitas 200kg',
        'Daya (kW)': 15,
        'Tekanan Udara (bar)': 6
      },
      {
        'Kode Mesin': 'NA-MANUAL',
        'Nama Mesin': 'Alat Press Manual',
        'Area': 'Laboratorium QC',
        'Status': 'INACTIVE',
        'Deskripsi': 'Alat press manual tablet uji coba',
        'Daya (kW)': 2.2,
        'Tekanan Udara (bar)': null
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(examples, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Mesin');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_data_mesin.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating machine Excel template:', error);
    return NextResponse.json(
      { message: 'Gagal membuat template Excel mesin' },
      { status: 500 }
    );
  }
}
