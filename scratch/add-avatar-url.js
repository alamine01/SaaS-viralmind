const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found in .env.local. Skipping direct Postgres migration.");
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
    console.log("Connected to PostgreSQL database.");

    const query = `
      ALTER TABLE monitored_accounts 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `;

    await client.query(query);
    console.log("Migration successful: added avatar_url to monitored_accounts table.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
