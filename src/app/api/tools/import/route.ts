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

export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can import
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      return NextResponse.json({ error: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported' }, { status: 400 });
    }

    // Parse file based on extension
    let dataRows: Record<string, any>[] = [];
    let headers: string[] = [];

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      dataRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

      if (dataRows.length === 0) {
        return NextResponse.json({ error: 'File Excel kosong atau tidak memiliki baris data' }, { status: 400 });
      }
      headers = Object.keys(dataRows[0]);
    } else {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
      }

      headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      dataRows = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        dataRows.push(row);
      }
    }

    // Helper to get value from row (case-insensitive)
    const getVal = (row: Record<string, any>, keys: string[]) => {
      for (const k of keys) {
        const foundKey = Object.keys(row).find(
          rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, '')
        );
        if (foundKey) return row[foundKey];
      }
      return '';
    };

    // Check required columns exist
    const hasName = headers.some(h => h.toLowerCase() === 'name');
    const hasStock = headers.some(h => h.toLowerCase() === 'stock');

    if (!hasName || !hasStock) {
      return NextResponse.json({ 
        error: 'Missing required columns. Required: name, stock',
        details: { foundHeaders: headers }
      }, { status: 400 });
    }

    // Parse data rows
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];

        const name = String(getVal(row, ['name'])).trim().replace(/^"|"$/g, '');
        const brand = String(getVal(row, ['brand'])).trim().replace(/^"|"$/g, '');
        const stockStr = String(getVal(row, ['stock'])).trim() || '0';
        const picUsername = String(getVal(row, ['picUsername'])).trim().replace(/^"|"$/g, '');
        
        if (!name) {
          skipped++;
          errors.push(`Row ${i + 2}: Nama tool tidak boleh kosong`);
          continue;
        }

        const stock = parseInt(stockStr);
        if (isNaN(stock) || stock < 0) {
          skipped++;
          errors.push(`Row ${i + 2}: Stok harus angka positif`);
          continue;
        }

        // Find PIC by username if provided
        let picId: string | null = null;
        if (picUsername) {
          const picUser = await prisma.user.findUnique({
            where: { username: picUsername }
          });
          if (picUser) {
            picId = picUser.id;
          } else {
            errors.push(`Row ${i + 2}: Username PIC "${picUsername}" tidak ditemukan, akan diabaikan`);
          }
        }

        // Check if tool with same name exists
        const existingTool = await prisma.tool.findFirst({
          where: { name: { equals: name } }
        });

        if (existingTool) {
          // Update existing tool
          await prisma.tool.update({
            where: { id: existingTool.id },
            data: {
              brand: brand || existingTool.brand,
              stock: stock,
              picId: picId || existingTool.picId
            }
          });
          imported++;
        } else {
          // Create new tool
          await prisma.tool.create({
            data: {
              name,
              brand: brand || null,
              stock,
              picId
            }
          });
          imported++;
        }
      } catch (err: any) {
        skipped++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${imported} tools. ${skipped > 0 ? `${skipped} baris dilewati.` : ''}`,
      summary: {
        imported,
        skipped,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error importing tools:', error);
    return NextResponse.json({ error: 'Failed to import tools' }, { status: 500 });
  }
}

// Helper to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
