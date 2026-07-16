import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const passwordHash = await bcrypt.hash('test1234', 10);
    const newUser = await prisma.user.create({
      data: {
        username: 'testop3',
        name: 'Test Operator',
        role: 'OPERATOR',
        passwordHash,
      }
    });
    console.log('User created:', newUser);
  } catch (err) {
    console.error('Error creating user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
