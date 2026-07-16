import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!admin) {
      console.log('Admin user not found');
      return;
    }
    const count = await prisma.workOrder.count({
      where: {
        woNumber: { startsWith: 'WO-A26/' }
      }
    });
    const sequence = String(count + 1).padStart(4, '0');
    const woNumber = `WO-A26/${sequence}`;

    console.log('Attempting to create work order with number:', woNumber);
    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        title: 'Test WO',
        description: 'Test Description',
        location: 'Test Location',
        category: 'PERBAIKAN',
        classification: null,
        priority: 'MEDIUM',
        status: 'OPEN',
        requestedById: admin.id,
        assignedToIds: [],
        assignedNames: [],
      }
    });
    console.log('Success:', workOrder);
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
