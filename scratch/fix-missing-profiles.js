const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixMissingProfiles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");

    // Select users that do not have a profile
    const querySelect = `
      SELECT id, email FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = u.id
      )
    `;
    const resSelect = await client.query(querySelect);
    console.log(`Found ${resSelect.rows.length} users with missing profiles.`);

    for (const row of resSelect.rows) {
      console.log(`Creating profile for ${row.email} (${row.id})...`);
      const insertQuery = `
        INSERT INTO profiles (id, full_name, plan, daily_script_count, monthly_analysis_count, last_script_reset, last_analysis_reset, created_at)
        VALUES ($1, $2, $3, 0, 0, NOW(), NOW(), NOW())
      `;
      await client.query(insertQuery, [row.id, row.email.split('@')[0], 'free']);
    }
    
    console.log("All missing profiles fixed successfully!");
  } catch (error) {
    console.error("Error fixing missing profiles:", error);
  } finally {
    await client.end();
  }
}

fixMissingProfiles();
