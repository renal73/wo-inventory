const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/MTCbuildup';
const pool = new Pool({ connectionString: dbUrl });

async function fixPriority() {
  const client = await pool.connect();
  
  try {
    console.log('Updating Priority enum values in WorkOrder table...');
    
    // Set semua ke LOW dulu dulu
    await client.query('UPDATE "WorkOrder" SET "priority" = \'LOW\'');
    console.log('  All set to LOW');
    
    // Hapus enum lama
    try {
      await client.query('DROP TYPE IF EXISTS "Priority_new" CASCADE');
      console.log('  Dropped Priority_new enum');
    } catch (e) { /* ignore */ }
    
    console.log('\nDone! All priorities set to LOW.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPriority();
