const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixPlans() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database.");

    // Mettre à jour tous les plans NULL à 'free' et s'assurer que les compteurs sont initialisés
    const query = `
      UPDATE profiles 
      SET 
        plan = 'free'
      WHERE plan IS NULL OR plan = '';
    `;

    const res = await client.query(query);
    console.log(`Successfully updated ${res.rowCount} user profiles with default 'free' plan.`);
  } catch (error) {
    console.error("Failed to fix null plans:", error);
  } finally {
    await client.end();
  }
}

fixPlans();
