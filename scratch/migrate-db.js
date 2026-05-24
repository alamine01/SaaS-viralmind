const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database.");

    const query = `
      ALTER TABLE monitored_accounts 
      ADD COLUMN IF NOT EXISTS followers_count BIGINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS median_views BIGINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS audit_report JSONB;
    `;

    await client.query(query);
    console.log("Migration successful: added columns to monitored_accounts.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
