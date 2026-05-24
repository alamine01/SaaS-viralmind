const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database successfully.");

    const query = `
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS monthly_analysis_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_analysis_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS daily_script_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_script_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `;

    await client.query(query);
    console.log("Migration successful: added subscription quota columns to profiles.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
