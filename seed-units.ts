import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL tidak diset!");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaultUnits = [
    { name: 'Unit', label: 'unit' },
    { name: 'Roll', label: 'roll' },
    { name: 'Pcs', label: 'pcs' },
    { name: 'Box', label: 'box' },
    { name: 'Pack', label: 'pack' },
    { name: 'Kg', label: 'kg' },
    { name: 'Meter', label: 'meter' },
    { name: 'Liter', label: 'liter' },
    { name: 'Set', label: 'set' },
    { name: 'Lembar', label: 'lembar' },
    { name: 'Botol', label: 'botol' },
    { name: 'Karton', label: 'karton' },
  ];

  for (const u of defaultUnits) {
    const existing = await prisma.unitOfMeasure.findUnique({ where: { name: u.name } });
    if (!existing) {
      await prisma.unitOfMeasure.create({ data: u });
      console.log('Created:', u.name);
    } else {
      console.log('Exists:', u.name);
    }
  }

  console.log('Seeding satuan selesai!');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});