const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkApifyProfileScraper() {
  console.log("Apify Token:", apifyToken ? "PRÉSENT" : "ABSENT");
  if (!apifyToken) return;

  const url = "https://www.instagram.com/moustapha.pb/";
  // Test distinct profile scrapers
  const actors = [
    "apify~instagram-profile-scraper",
    "jaroslavsemanko~instagram-profile-scraper",
    "apify~instagram-scraper"
  ];

  for (const actor of actors) {
    const apifyUrl = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}`;
    try {
      console.log(`Calling Apify with actor ${actor}...`);
      const response = await fetch(apifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "usernames": ["moustapha.pb"],
          "resultsLimit": 1
        })
      });
      
      if (response.ok) {
        const items = await response.json();
        console.log(`[${actor}] SUCCESS. Items:`, items.length);
        if (items.length > 0) {
          console.log(`[${actor}] Keys:`, Object.keys(items[0]).join(", "));
          console.log(`[${actor}] Followers:`, items[0].followersCount || items[0].followers || items[0].ownerFollowersCount);
          break;
        }
      } else {
        console.log(`[${actor}] FAILED. Status:`, response.status, response.statusText);
      }
    } catch (e) {
      console.log(`[${actor}] ERROR:`, e.message);
    }
  }
}

checkApifyProfileScraper();
