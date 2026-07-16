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
    if (!user || (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'File kosong atau format tidak sesuai' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, any>;
      
      // Support both Indonesian and English column names
      const name = (row['Nama Ruangan'] || row['Name'] || row['name'] || '').toString().trim();
      const description = (row['Deskripsi'] || row['Description'] || row['description'] || '').toString().trim();

      if (!name) {
        skipped++;
        continue;
      }

      try {
        // Check if room already exists
        const existing = await prisma.room.findFirst({ where: { name } });
        if (existing) {
          // Reactivate if inactive
          if (!existing.isActive) {
            await prisma.room.update({
              where: { id: existing.id },
              data: { isActive: true, description: description || existing.description },
            });
            imported++;
          } else {
            skipped++;
          }
          continue;
        }

        await prisma.room.create({
          data: {
            name,
            description: description || null,
          },
        });
        imported++;
      } catch (err: any) {
        errors.push(`Baris ${i + 2}: ${err.message || 'Gagal import'}`);
      }
    }

    return NextResponse.json({
      message: `Import selesai: ${imported} berhasil, ${skipped} dilewati`,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to import rooms:', error);
    return NextResponse.json({ error: 'Gagal import ruangan' }, { status: 500 });
  }
}