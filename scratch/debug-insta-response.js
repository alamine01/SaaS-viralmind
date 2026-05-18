const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function debugInsta() {
  const handle = "leomessi";
  const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
  
  const url = `https://${instaHost}/get_ig_user_about.php?username_or_url=${handle}`;
  console.log(`Calling Instagram Scraper GET for ${url}...`);
  const instaRes = await fetch(url, {
    method: 'GET',
    headers: { 
      'X-RapidAPI-Key': apiKey || "", 
      'X-RapidAPI-Host': instaHost
    }
  });
  
  const data = await instaRes.json();
  console.log("\n=================================");
  console.log("Raw Response Keys:", Object.keys(data));
  console.log("Response JSON (first 800 chars):\n", JSON.stringify(data).substring(0, 800));
  console.log("=================================");
}

debugInsta();
