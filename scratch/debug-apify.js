const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const url = "https://www.instagram.com/reels/C5g1vNIM-sX/";

async function debug() {
  const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  
  console.log("Appel à Apify...");
  const response = await fetch(apifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      "directUrls": [url],
      "resultsLimit": 1,
      "scrapeSponsorship": false
    })
  });

  const items = await response.json();
  console.log("Nombre d'items reçus:", items.length);
  if (items.length > 0) {
    console.log("Structure du premier item:");
    console.log(JSON.stringify(items[0], null, 2));
    
    // Check for followers specifically
    const possibleFields = [
      'ownerFollowersCount', 
      'followers', 
      'followerCount', 
      'owner',
      'ownerFullName',
      'user'
    ];
    
    console.log("\nChamps trouvés pour les followers:");
    possibleFields.forEach(field => {
      console.log(`${field}:`, items[0][field]);
      if (typeof items[0][field] === 'object') {
        console.log(`Contenu de ${field}:`, JSON.stringify(items[0][field], null, 2));
      }
    });
  }
}

debug();
