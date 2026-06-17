import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
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
        { message: 'File Excel tidak ditemukan' },
        { status: 400 }
      );
    }

    // Baca array buffer dari file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Baca workbook Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Ubah worksheet menjadi array JSON
    // { defval: "" } memastikan sel kosong diisi string kosong
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'File Excel kosong atau tidak memiliki baris data' },
        { status: 400 }
      );
    }

    // Lakukan import data dalam satu transaksi database
    const result = await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      let failedCount = 0;

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

      for (const row of rows) {
        // Pemetaan kolom dari excel
        // Kita support pencocokan header case-insensitive atau variasi spasi
        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(
              rk => rk.toLowerCase().replace(/\s/g, '') === k.toLowerCase().replace(/\s/g, '')
            );
            if (foundKey) return row[foundKey];
          }
          return '';
        };

        const rawId = getVal(['partid', 'idbarang', 'id']);
        const name = getVal(['namasukucadang', 'namabarang', 'nama']);
        const categoryName = getVal(['kategori', 'category']);
        const stockVal = getVal(['stokfisik', 'stok', 'jumlah']);
        const rackLocation = getVal(['lokasirak', 'rak', 'lokasi']);
        const priceVal = getVal(['hargasatuan', 'harga']);
        const vendor = getVal(['vendor', 'supplier']);
        const description = getVal(['deskripsi', 'keterangan']);

        if (!rawId || !name || !categoryName) {
          failedCount++;
          continue;
        }

        const partId = String(rawId).toUpperCase().trim();
        const partName = String(name).trim();
        const catName = String(categoryName).trim();
        const stock = Number(stockVal) || 0;
        const price = Number(priceVal) || 0;
        const rack = String(rackLocation).trim() || null;
        const vend = String(vendor).trim() || null;
        const desc = String(description).trim() || null;

        // 1. Cek atau buat kategori
        let category = await tx.category.findFirst({
          where: {
            name: {
              equals: catName,
              mode: 'insensitive'
            }
          }
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: catName,
              icon: 'Package'
            }
          });
        }

        // 2. Cek apakah part sudah ada
        const existingPart = await tx.part.findUnique({
          where: { id: partId }
        });

        if (existingPart) {
          const oldStock = existingPart.stock;
          const diff = stock - oldStock;

          if (diff > 0) {
            // Catat transaksi masuk
            await tx.inboundTransaction.create({
              data: {
                partId: partId,
                quantity: diff,
                price: price,
                vendor: vend || 'Impor Penyesuaian Excel',
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

          // Jika ada, kita update stok (jika berbeda), harga, rak, dll.
          await tx.part.update({
            where: { id: partId },
            data: {
              name: partName,
              description: desc,
              categoryId: category.id,
              stock: stock,
              price: price,
              rackLocation: rack,
              vendor: vend,
              updatedAt: new Date()
            }
          });
          updatedCount++;
        } else {
          // Jika baru, kita buat part baru
          await tx.part.create({
            data: {
              id: partId,
              name: partName,
              description: desc,
              categoryId: category.id,
              stock: stock,
              price: price,
              rackLocation: rack,
              vendor: vend,
              minStockAlert: 5
            }
          });

          // Catat transaksi masuk awal jika stok fisik yang diimpor > 0
          if (stock > 0) {
            await tx.inboundTransaction.create({
              data: {
                partId: partId,
                quantity: stock,
                price: price,
                vendor: vend || 'Impor Awal Excel',
                createdBy: userId,
                date: new Date()
              }
            });
          }
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
    console.error('Error POST /api/import-excel:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengimpor Excel' },
      { status: 500 }
    );
  }
}
