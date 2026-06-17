import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL tidak diset!");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Memulai database seeding...');

  // Baca db.json jika ada untuk mengambil data terupdate
  const dbPath = path.join(process.cwd(), 'db.json');
  let data: any;

  if (fs.existsSync(dbPath)) {
    console.log('Membaca data dari db.json...');
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    data = JSON.parse(rawData);
  } else {
    console.error('File db.json tidak ditemukan! Seeding dihentikan.');
    process.exit(1);
  }

  // 1. Bersihkan database terlebih dahulu (Clean Up)
  console.log('Membersihkan tabel database lama...');
  await prisma.outboundTransaction.deleteMany();
  await prisma.inboundTransaction.deleteMany();
  await prisma.machinePart.deleteMany();
  await prisma.part.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.usagePurpose.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seeding Users
  console.log('Seeding Users...');
  for (const u of data.users) {
    // Tentukan password default
    let plainPassword = `${u.username}123`;
    if (u.username === 'admin') plainPassword = 'admin123';
    if (u.username === 'user') plainPassword = 'user123';

    const passwordHash = bcrypt.hashSync(plainPassword, 10);
    
    await prisma.user.create({
      data: {
        id: u.id,
        username: u.username,
        name: u.name,
        passwordHash: passwordHash,
        role: u.role === 'ADMIN' ? 'ADMIN' : 'USER',
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt)
      }
    });
  }

  // 3. Seeding Kategori
  console.log('Seeding Kategori...');
  for (const c of data.categories) {
    await prisma.category.create({
      data: {
        id: c.id,
        name: c.name,
        icon: c.icon || null,
        createdAt: new Date(c.createdAt)
      }
    });
  }

  // 4. Seeding Tujuan Penggunaan (Usage Purposes)
  console.log('Seeding Tujuan Penggunaan...');
  for (const p of data.usagePurposes) {
    await prisma.usagePurpose.create({
      data: {
        id: p.id,
        purpose: p.purpose,
        isActive: p.isActive !== undefined ? p.isActive : true,
        createdAt: new Date(p.createdAt)
      }
    });
  }

  // 5. Seeding Mesin
  console.log('Seeding Mesin...');
  for (const m of data.machines) {
    await prisma.machine.create({
      data: {
        id: m.id,
        name: m.name,
        description: m.description || null,
        area: m.area || null,
        status: m.status,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt)
      }
    });
  }

  // 6. Seeding Suku Cadang (Parts)
  console.log('Seeding Suku Cadang...');
  for (const p of data.parts) {
    await prisma.part.create({
      data: {
        id: p.id,
        name: p.name,
        description: p.description || null,
        categoryId: p.categoryId,
        stock: p.stock,
        minStockAlert: p.minStockAlert,
        price: p.price,
        rackLocation: p.rackLocation || null,
        vendor: p.vendor || null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }
    });
  }

  // 7. Seeding MachinePart Hubungan
  console.log('Seeding Hubungan Mesin dan Suku Cadang...');
  for (const mp of data.machineParts) {
    await prisma.machinePart.create({
      data: {
        id: mp.id,
        machineId: mp.machineId,
        partId: mp.partId,
        partType: mp.partType,
        recommendedMinQty: mp.recommendedMinQty,
        notes: mp.notes || null,
        assignedAt: new Date(mp.assignedAt)
      }
    });
  }

  // 8. Seeding Transaksi Inbound
  console.log('Seeding Transaksi Masuk...');
  for (const t of data.inboundTransactions) {
    await prisma.inboundTransaction.create({
      data: {
        id: t.id,
        partId: t.partId,
        quantity: t.quantity,
        price: t.price,
        vendor: t.vendor,
        createdBy: t.createdBy,
        date: new Date(t.date)
      }
    });
  }

  // 9. Seeding Transaksi Outbound
  console.log('Seeding Transaksi Keluar...');
  for (const t of data.outboundTransactions) {
    await prisma.outboundTransaction.create({
      data: {
        id: t.id,
        partId: t.partId,
        quantity: t.quantity,
        purposeId: t.purposeId,
        machineId: t.machineId || null,
        createdBy: t.createdBy,
        date: new Date(t.date)
      }
    });
  }

  console.log('Database seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
