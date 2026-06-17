import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { decryptSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Ambil sesi user saat ini untuk audit trail
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    const sessionUser = token ? decryptSession(token) : null;
    const userId = sessionUser?.id || 'usr-admin'; // fallback default

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'File CSV tidak ditemukan' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) {
      return NextResponse.json(
        { message: 'File CSV kosong atau tidak memiliki data' },
        { status: 400 }
      );
    }

    // Parser CSV sederhana yang menangani tanda kutip ganda secara dasar
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const result = await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

      const categories = await tx.category.findMany();
      const categoryMap = new Map<string, any>();
      categories.forEach(c => {
        categoryMap.set(c.name.toLowerCase().trim(), c);
      });

      const parts = await tx.part.findMany();
      const partMap = new Map<string, boolean>();
      parts.forEach(p => {
        partMap.set(p.id.toUpperCase().trim(), true);
      });

      // Cari atau buat default UsagePurpose untuk penyesuaian stok keluar
      let adjustmentPurpose = await tx.usagePurpose.findFirst({
        where: { purpose: "Penyesuaian Stok (Impor)" }
      });
      if (!adjustmentPurpose) {
        adjustmentPurpose = await tx.usagePurpose.create({
          data: {
            id: 'pur-adj-import',
            purpose: "Penyesuaian Stok (Impor)",
            isActive: true
          }
        });
      }

      // Lewati baris pertama (header)
      // Asumsi header: Part ID, Nama Suku Cadang, Kategori, Stok Fisik, Lokasi Rak, Harga Satuan, Vendor
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = parseCsvLine(line);
        if (cols.length < 3) {
          failedCount++;
          continue;
        }

        const rawId = cols[0];
        const name = cols[1];
        const categoryName = cols[2];
        const stock = Number(cols[3]) || 0;
        const rackLocation = cols[4] || null;
        const price = Number(cols[5]) || 0;
        const vendor = cols[6] || null;

        if (!rawId || !name || !categoryName) {
          failedCount++;
          continue;
        }

        const partId = rawId.toUpperCase().trim();
        const categoryKey = categoryName.toLowerCase().trim();

        // Cek/buat kategori jika tidak ada
        let category = categoryMap.get(categoryKey);

        if (!category) {
          // Buat kategori baru dengan ikon Package default
          category = await tx.category.create({
            data: {
              id: `cat-${Math.random().toString(36).substr(2, 9)}`,
              name: categoryName.trim(),
              icon: 'Package'
            }
          });
          categoryMap.set(categoryKey, category);
        }

        // Cek jika part ID sudah ada
        const exists = partMap.has(partId);

        if (exists) {
          // Cari data part saat ini
          const existingPart = await tx.part.findUnique({
            where: { id: partId }
          });
          const oldStock = existingPart ? existingPart.stock : 0;
          const diff = stock - oldStock;

          if (diff > 0) {
            // Catat transaksi masuk
            await tx.inboundTransaction.create({
              data: {
                partId: partId,
                quantity: diff,
                price: price,
                vendor: vendor || 'Impor Penyesuaian CSV',
                createdBy: userId
              }
            });
          } else if (diff < 0) {
            // Catat transaksi keluar
            await tx.outboundTransaction.create({
              data: {
                partId: partId,
                quantity: Math.abs(diff),
                purposeId: adjustmentPurpose.id,
                createdBy: userId
              }
            });
          }

          // Update part existing
          await tx.part.update({
            where: { id: partId },
            data: {
              name: name.trim(),
              categoryId: category.id,
              stock: stock, // Overwrite stok dari CSV
              price: price, // Overwrite harga dari CSV
              rackLocation: rackLocation,
              vendor: vendor
            }
          });
          updatedCount++;
        } else {
          // Buat part baru
          await tx.part.create({
            data: {
              id: partId,
              name: name.trim(),
              categoryId: category.id,
              stock: stock,
              minStockAlert: 5, // Default min stock
              price: price,
              rackLocation: rackLocation,
              vendor: vendor
            }
          });

          // Catat transaksi masuk awal jika stok fisik yang diimpor > 0
          if (stock > 0) {
            await tx.inboundTransaction.create({
              data: {
                partId: partId,
                quantity: stock,
                price: price,
                vendor: vendor || 'Impor Awal CSV',
                createdBy: userId
              }
            });
          }

          partMap.set(partId, true);
          createdCount++;
        }
      }

      return { createdCount, updatedCount, failedCount };
    });

    return NextResponse.json({
      success: true,
      message: `Impor data selesai. ${result.createdCount} item dibuat, ${result.updatedCount} item diperbarui, ${result.failedCount} item gagal.`
    });
  } catch (error) {
    console.error('Error POST /api/import-csv:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengimpor CSV' },
      { status: 500 }
    );
  }
}
