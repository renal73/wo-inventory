import prisma from './src/lib/prisma';

async function fix() {
  console.log('Updating WorkOrder priorities using raw SQL...');
  
  // Use raw SQL to update old priority values to new one
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "WorkOrder" 
    SET priority = 'PROSES_BERJALAN'::"Priority_new"
    WHERE priority IN ('HIGH', 'MEDIUM', 'LOW', 'URGENT')
  `);
  
  console.log(`Updated ${result} records`);
}

fix()
  .then(() => process.exit())
  .catch(e => { console.error(e); process.exit(1); });
