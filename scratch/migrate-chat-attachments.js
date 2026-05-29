const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env.local.");
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database successfully.");

    // 1. Add upload limit columns to profiles table
    console.log("Migrating profiles table...");
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS daily_upload_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_upload_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
    console.log("profiles table updated successfully.");

    // 2. Add attachment columns to script_messages table
    console.log("Migrating script_messages table...");
    await client.query(`
      ALTER TABLE script_messages 
      ADD COLUMN IF NOT EXISTS attachment_url TEXT,
      ADD COLUMN IF NOT EXISTS attachment_name TEXT,
      ADD COLUMN IF NOT EXISTS attachment_type TEXT,
      ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
    `);
    console.log("script_messages table updated successfully.");

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
