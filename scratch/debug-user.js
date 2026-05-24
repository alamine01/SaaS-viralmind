const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log("Checking auth users...");
    const usersRes = await client.query("SELECT id, email FROM auth.users");
    console.log("Auth Users:");
    console.table(usersRes.rows);

    console.log("Checking profiles...");
    const profilesRes = await client.query("SELECT id, full_name, plan FROM profiles");
    console.log("Profiles:");
    console.table(profilesRes.rows);

  } catch (error) {
    console.error("Error debugging:", error);
  } finally {
    await client.end();
  }
}

debugUser();
