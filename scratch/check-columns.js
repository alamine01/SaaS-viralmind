const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env.local");
    return;
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'monitored_accounts';
    `);
    console.log("Columns of monitored_accounts:");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
