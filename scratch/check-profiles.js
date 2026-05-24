const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, full_name, plan, daily_script_count, monthly_analysis_count, 
             last_script_reset, last_analysis_reset 
      FROM profiles 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.table(res.rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

check();
