const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkScraperFullDetails() {
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
        "resultsLimit": 5,
        "resultsType": "posts"
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      console.log("Total items:", items.length);
      if (items.length > 0) {
        console.log("Keys of first item:", Object.keys(items[0]).join(", "));
        console.log("Has owner object? or any nested profile info?");
        // Find if there is any field containing follower count, abonnés, owner, or followers
        const sample = items[0];
        for (const k of Object.keys(sample)) {
          if (typeof sample[k] === 'object' && sample[k] !== null) {
            console.log(`  Key "${k}" is object:`, Object.keys(sample[k]));
          }
        }
      }
    } else {
      console.log("Failed. Status:", response.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkScraperFullDetails();
