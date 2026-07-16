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

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';

    // Template rows dengan kolom baru
    const sampleRows = [
      {
        Title: 'Mesin CNC tidak bisa dinyalakan',
        Description: 'Mesin CNC di gedung A line produksi 1 mati total saat dinyalakan pagi ini',
        Location: 'Gedung A - Line Produksi 1',
        Room: 'Ruang Produksi CNC',
        Category: 'PERBAIKAN',
        Classification: 'ELECTRIC',
        'Job Category': 'MACHINERY',
        Priority: 'HIGH',
        'Requested Dept': 'PR',
        'Requested By Name': 'operator1',
        Status: 'OPEN',
        'Closed By Name': '',
        'Duration (minutes)': '',
        'Parts Used': '',
      },
      {
        Title: 'Pembuatan rak spare part baru',
        Description: 'Perlu pembuatan rak untuk menyimpan spare part inverter',
        Location: 'Gudang Utama',
        Room: 'Ruang Gudang 1',
        Category: 'PEMBUATAN',
        Classification: '',
        'Job Category': 'FACILITY_BUILDING',
        Priority: 'MEDIUM',
        'Requested Dept': 'GA',
        'Requested By Name': 'operator1',
        Status: 'OPEN',
        'Closed By Name': '',
        'Duration (minutes)': '',
        'Parts Used': '',
      },
      {
        Title: 'Fire alarm tidak berfungsi',
        Description: 'Fire alarm di gedung utama tidak aktif',
        Location: 'Gedung Utama - Lantai 2',
        Room: 'Ruang Lobby',
        Category: 'KESELAMATAN',
        Classification: 'ELECTRIC',
        'Job Category': 'FACILITY_BUILDING',
        Priority: 'HIGH',
        'Requested Dept': 'HS',
        'Requested By Name': 'operator1',
        Status: 'CLOSED',
        'Closed By Name': 'teknisi1',
        'Duration (minutes)': '45',
        'Parts Used': 'PART001:2, PART002:1',
      },
    ];

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleRows);

      worksheet['!cols'] = [
        { wch: 30 },  // Title
        { wch: 40 },  // Description
        { wch: 25 },  // Location
        { wch: 25 },  // Room
        { wch: 14 },  // Category
        { wch: 14 },  // Classification
        { wch: 18 },  // Job Category
        { wch: 10 },  // Priority
        { wch: 15 },  // Requested Dept
        { wch: 20 },  // Requested By Name
        { wch: 10 },  // Status
        { wch: 18 },  // Closed By Name
        { wch: 18 },  // Duration (minutes)
        { wch: 35 },  // Parts Used
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Orders');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="work-orders-import-template.xlsx"',
        },
      });
    }

    // CSV Template (default)
    const headers = [
      'Title',
      'Description',
      'Location',
      'Room',
      'Category',
      'Classification',
      'Job Category',
      'Priority',
      'Requested Dept',
      'Requested By Name',
      'Status',
      'Closed By Name',
      'Duration (minutes)',
      'Parts Used'
    ];

    const exampleRows = [
      [
        '"Mesin CNC tidak bisa dinyalakan"',
        '"Mesin CNC di gedung A line produksi 1 mati total"',
        '"Gedung A - Line Produksi 1"',
        '"Ruang Produksi CNC"',
        'PERBAIKAN',
        'ELECTRIC',
        'MACHINERY',
        'HIGH',
        'PR',
        'operator1',
        'OPEN',
        '',
        '',
        '',
      ],
      [
        '"Fire alarm tidak berfungsi"',
        '"Fire alarm di gedung utama tidak aktif"',
        '"Gedung Utama - Lantai 2"',
        '"Ruang Lobby"',
        'KESELAMATAN',
        'ELECTRIC',
        'FACILITY_BUILDING',
        'HIGH',
        'HS',
        'operator1',
        'CLOSED',
        'teknisi1',
        '45',
        '"PART001:2, PART002:1"',
      ],
    ];

    const validValues = `# ============================================
# WORK ORDER IMPORT TEMPLATE
# ============================================
# Created: ${new Date().toISOString()}
# ============================================

# KOLOM YANG WAJIB DIISI:
# - Title (Judul Work Order)
# - Description (Deskripsi Detail)
# - Location (Lokasi/Area)
# - Room (Nama Ruangan - harus ada di master ruangan)

# KOLOM OPSIONAL:
# - Category: PERBAIKAN, PEMBUATAN, INSTALASI, MODIFIKASI, KESELAMATAN (default: PERBAIKAN)
# - Priority: LOW, MEDIUM, HIGH (default: LOW)
# - Classification: ELECTRIC, MECHANIC, SIPIL, OTHER (kosongkan jika tidak ada)
# - Job Category: MACHINERY, UTILITY, FACILITY_BUILDING (kosongkan jika tidak ada)
# - Requested Dept: PR, QC, GA, HS, SC, QA (Departemen peminta)
#   - PR = Produksi (untuk akun Operator Produksi)
#   - QC = Quality Control (untuk akun Analyst)
#   - GA = General Affairs (untuk akun User biasa)
#   - HS = HSE (untuk akun User biasa)
#   - SC = Supply Chain (untuk akun User biasa)
#   - QA = Quality Assurance (untuk akun User biasa)
# - Requested By Name: Username dari requester (akan di-lookup ke database user)
# - Status: OPEN, CLOSED (default: OPEN)
# - Closed By Name: Username penutup WO (wajib diisi jika Status = CLOSED)
# - Duration (minutes): Durasi pengerjaan dalam menit (wajib diisi jika Status = CLOSED)
# - Parts Used: Format "PartID:qty, PartID:qty" (contoh: "PART001:2, PART002:1")

# ============================================
# DATA
# ============================================
`;

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n');

    const filename = 'work-orders-import-template.csv';

    return new NextResponse(validValues + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}