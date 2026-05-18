const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkTikTokUserInfo() {
  const handle = "tiboinshape";
  const tiktokHost = "tiktok-video-no-watermark2.p.rapidapi.com";
  
  const url = `https://${tiktokHost}/user/info?unique_id=${handle}`;
  console.log(`Calling TikTok user/info for ${url}...`);
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      'X-RapidAPI-Key': apiKey || "", 
      'X-RapidAPI-Host': tiktokHost
    }
  });
  
  const data = await res.json();
  console.log("\n=================================");
  console.log("Raw Response Keys:", Object.keys(data));
  console.log("Stats Object:", data.data?.stats ? JSON.stringify(data.data.stats) : "Not found");
  console.log("Follower Count:", data.data?.stats?.followerCount || "Not found");
  console.log("=================================");
}

checkTikTokUserInfo();
