const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found.");
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT * FROM saved_items WHERE type = 'script' LIMIT 5");
    console.log("Saved scripts in DB:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
