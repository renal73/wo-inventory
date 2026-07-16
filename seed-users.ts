import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding users...');

  const users = [
    { username: 'admin',    name: 'Administrator',       role: 'ADMIN' as const,      password: 'admin123' },
    { username: 'teknisi1', name: 'Budi Teknisi',         role: 'TECHNICIAN' as const, password: 'teknisi1123' },
    { username: 'teknisi2', name: 'Dedi Mekanik',         role: 'TECHNICIAN' as const, password: 'teknisi2123' },
    { username: 'operator1',name: 'Agus Operator',        role: 'OPERATOR' as const,   password: 'operator1123' },
    { username: 'qc1',      name: 'Sari QC Analyst',     role: 'QC_ANALYST' as const, password: 'qc1123' },
    { username: 'gudang',   name: 'Eko Warehouse',        role: 'WAREHOUSE' as const,  password: 'gudang123' },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`  ⏭  User "${u.username}" sudah ada, skip.`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.create({
      data: { username: u.username, name: u.name, role: u.role, passwordHash }
    });
    console.log(`  ✅ Created user "${u.username}" (${u.role}) | password: ${u.password}`);
  }

  console.log('\n✅ Seeding selesai!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
