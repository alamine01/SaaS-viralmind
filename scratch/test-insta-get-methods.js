const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkEndpointGET(pathName) {
  const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
  const url = `https://${instaHost}/${pathName}?username_or_url=leomessi`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'X-RapidAPI-Key': apiKey || "", 
        'X-RapidAPI-Host': instaHost
      }
    });
    const text = await res.text();
    let status = res.status;
    console.log(`Endpoint GET /${pathName} -> Status: ${status} | Response length: ${text.length}`);
    if (status === 200 && !text.includes("does not exist") && !text.includes("not found")) {
      console.log(`  -> SUCCESS! Snippet: ${text.substring(0, 300)}\n`);
    }
  } catch (e) {
    console.log(`Endpoint GET /${pathName} failed:`, e.message);
  }
}

async function start() {
  const endpoints = [
    "get_ig_user_info.php",
    "get_user_info.php",
    "get_user_posts.php",
    "get_user_reels.php",
    "get_user_feed.php",
    "get_user_medias.php"
  ];
  for (const ep of endpoints) {
    await checkEndpointGET(ep);
  }
}

start();
