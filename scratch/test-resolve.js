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
    const countRes = await client.query("SELECT COUNT(*) FROM script_messages");
    console.log("Total messages in script_messages:", countRes.rows[0].count);

    const sampleRes = await client.query("SELECT id, discussion_id, role, content, script_data FROM script_messages WHERE script_data IS NOT NULL LIMIT 5");
    console.log("Sample script_data messages:", JSON.stringify(sampleRes.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
