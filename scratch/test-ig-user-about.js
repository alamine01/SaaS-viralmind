const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkAbout() {
  const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
  const url = `https://${instaHost}/get_ig_user_about.php?username_or_url=tiboinshape`;
  
  try {
    const res = await fetch(url, {
      headers: { 
        'X-RapidAPI-Key': apiKey || "", 
        'X-RapidAPI-Host': instaHost
      }
    });
    const data = await res.json();
    console.log("User About Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Failed to fetch user about:", e.message);
  }
}

checkAbout();
