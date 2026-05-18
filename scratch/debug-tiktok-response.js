const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function debugTikTok() {
  const handle = "tiboinshape";
  const tiktokHost = "tiktok-video-no-watermark2.p.rapidapi.com";
  
  const url = `https://${tiktokHost}/user/posts?unique_id=${handle}&count=2`;
  console.log(`Calling TikTok user/posts for ${url}...`);
  const res = await fetch(url, {
    method: 'GET',
    headers: { 
      'X-RapidAPI-Key': apiKey || "", 
      'X-RapidAPI-Host': tiktokHost
    }
  });
  
  const data = await res.json();
  const videosList = data.data?.videos || data.videos || data.data || [];
  
  console.log("\n=================================");
  console.log("Videos found:", videosList.length);
  if (videosList.length > 0) {
    const first = videosList[0];
    console.log("Keys in first video object:", Object.keys(first));
    console.log("Author object:", first.author ? JSON.stringify(first.author) : "Not present");
    console.log("Author stats object:", first.author_stats ? JSON.stringify(first.author_stats) : "Not present");
    console.log("Statistics object:", first.statistics ? JSON.stringify(first.statistics) : "Not present");
  }
  console.log("=================================");
}

debugTikTok();
