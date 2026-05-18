const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkScraperProfile() {
  if (!apifyToken) return;

  const actor = "apify~instagram-scraper";
  const apifyUrl = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}`;
  
  try {
    console.log("Calling apify/instagram-scraper with profile URL...");
    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "directUrls": ["https://www.instagram.com/tiboinshape/"],
        "resultsLimit": 10
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      console.log("Number of items returned by standard scraper:", items.length);
      if (items.length > 0) {
        items.slice(0, 5).forEach((p, idx) => {
          console.log(`\nPost [${idx + 1}]:`);
          console.log(`  Shortcode: ${p.shortCode}`);
          console.log(`  Caption: ${p.caption ? p.caption.substring(0, 50) : 'None'}`);
          console.log(`  videoViewCount: ${p.videoViewCount}`);
          console.log(`  videoPlayCount: ${p.videoPlayCount}`);
          console.log(`  playCount: ${p.playCount}`);
          console.log(`  likesCount: ${p.likesCount}`);
        });
      }
    } else {
      console.log("Failed. Status:", response.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkScraperProfile();
