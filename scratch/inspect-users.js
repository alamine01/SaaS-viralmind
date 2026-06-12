const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
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
    console.log("Connected to database.");

    // Check profiles columns
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles';
    `);
    console.log("Columns in profiles table:");
    console.log(columnsRes.rows.map(r => `${r.column_name}: ${r.data_type}`).join("\n"));

    // Check existing profiles
    const profilesRes = await client.query(`
      SELECT id, email, plan, full_name FROM profiles;
    `);
    console.log("\nExisting Profiles:");
    console.log(JSON.stringify(profilesRes.rows, null, 2));

  } catch (error) {
    console.error("Inspection failed:", error);
  } finally {
    await client.end();
  }
}

inspect();
