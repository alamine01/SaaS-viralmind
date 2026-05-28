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
      ALTER TABLE workspaces 
      ADD COLUMN IF NOT EXISTS voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL;
    `;

    await client.query(query);
    console.log("Migration successful: added voice_profile_id to workspaces table.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
