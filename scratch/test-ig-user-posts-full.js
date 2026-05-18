const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkDetails() {
  const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
  const url = `https://${instaHost}/get_ig_user_posts.php`;
  
  const options = {
    method: 'POST',
    headers: { 
      'X-RapidAPI-Key': apiKey || "", 
      'X-RapidAPI-Host': instaHost,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ username_or_url: 'leomessi' })
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    console.log("\n=================================");
    console.log("Full data:", JSON.stringify(data, null, 2).substring(0, 1000));
    console.log("=================================");
  } catch (e) {
    console.log("Failed to fetch details:", e.message);
  }
}

checkDetails();
