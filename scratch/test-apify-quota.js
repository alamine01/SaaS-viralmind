const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkApify() {
  console.log("Apify Token:", apifyToken ? "PRÉSENT" : "ABSENT");
  if (!apifyToken) return;

  const url = "https://www.instagram.com/reel/C8IEGXTN45s/";
  const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
  
  try {
    console.log("Calling Apify...");
    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "directUrls": [url],
        "resultsLimit": 1,
        "scrapeSponsors": false
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      console.log("Apify response received. Number of items:", items.length);
      if (items.length > 0) {
        console.log("Keys in item:", Object.keys(items[0]).join(", "));
        console.log("Owner info:", items[0].ownerFullName, "@" + items[0].ownerUsername);
      }
    } else {
      console.log("Apify call failed. Status:", response.status, response.statusText);
      const text = await response.text();
      console.log("Response text:", text);
    }
  } catch (e) {
    console.log("Apify error:", e.message);
  }
}

checkApify();
