import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('user123', 10);

  // Cek apakah admin sudah ada
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (!existingAdmin) {
    console.log('Admin tidak ditemukan. Membuat user default...');
    await prisma.user.createMany({
      data: [
        {
          id: 'usr-admin',
          username: 'admin',
          name: 'Supervisor Engineering',
          passwordHash: adminHash,
          role: 'ADMIN'
        },
        {
          id: 'usr-user',
          username: 'user',
          name: 'Teknisi Lapangan',
          passwordHash: userHash,
          role: 'USER'
        }
      ]
    });
    console.log('Berhasil membuat user admin dan user!');
  } else {
    console.log('User admin sudah ada di database.');
    
    // Kita reset passwordnya sekalian untuk memastikan login bisa jalan
    await prisma.user.update({
      where: { username: 'admin' },
      data: { passwordHash: adminHash }
    });
    console.log('Password admin direset menjadi admin123');
  }

  const users = await prisma.user.findMany({
    select: {
      username: true,
      role: true
    }
  });
  console.log('User di database:', users);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
