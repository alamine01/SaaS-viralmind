const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkTikTokAPI() {
  const host = "tiktok-video-no-watermark2.p.rapidapi.com";
  const url = `https://${host}/user/info?unique_id=khabyyyyyyyyyyyyu`;
  
  try {
    const res = await fetch(url, {
      headers: { 
        'X-RapidAPI-Key': apiKey || "", 
        'X-RapidAPI-Host': host
      }
    });
    const data = await res.json();
    console.log("TikTok API Response for non-existent user:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Failed:", e.message);
  }
}

checkTikTokAPI();
