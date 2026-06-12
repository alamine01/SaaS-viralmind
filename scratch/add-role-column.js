const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing in env.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    // 1. Add role column
    console.log("Adding role column to profiles table...");
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    `);
    console.log("role column successfully verified/added.");

    // 2. Set admin role for Amadou Fall (amadou.fall.amf@gmail.com)
    console.log("Setting role = 'admin' for amadou.fall.amf@gmail.com...");
    const res = await client.query(`
      UPDATE profiles 
      SET role = 'admin' 
      WHERE id = 'c1eef1bb-317e-488a-8e8a-ce8c5c2091dd'
      RETURNING id, email, role, full_name;
    `);
    
    if (res.rowCount > 0) {
      console.log("Successfully updated admin user profile:", res.rows[0]);
    } else {
      console.log("User c1eef1bb-317e-488a-8e8a-ce8c5c2091dd not found or not updated.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
