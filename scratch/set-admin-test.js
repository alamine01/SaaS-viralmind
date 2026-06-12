const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setAdmin() {
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

    // Find the user ID for test@gmail.com from auth.users
    const userRes = await client.query(`
      SELECT id, email FROM auth.users WHERE email = 'test@gmail.com';
    `);

    if (userRes.rowCount === 0) {
      console.error("User test@gmail.com not found in auth.users.");
      return;
    }

    const userId = userRes.rows[0].id;
    console.log(`Found user ID for test@gmail.com: ${userId}`);

    // Update their profile to set role = 'admin'
    const res = await client.query(`
      UPDATE profiles 
      SET role = 'admin' 
      WHERE id = $1
      RETURNING id, email, role, full_name;
    `, [userId]);
    
    if (res.rowCount > 0) {
      console.log("Successfully set test@gmail.com as admin:", res.rows[0]);
    } else {
      console.log(`Profile for user ID ${userId} not found or not updated.`);
    }
  } catch (error) {
    console.error("Failed to set admin:", error);
  } finally {
    await client.end();
  }
}

setAdmin();
