const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.RAPIDAPI_KEY;
const username = "yomi.denzel";

const endpoints = [
  "get_user_feed.php",
  "get_user_medias.php",
  "get_user_media.php",
  "get_ig_posts.php",
  "get_ig_reels.php",
  "get_ig_user_medias.php",
  "get_user_posts_v2.php",
  "get_user_reels_v2.php",
  "user_posts.php",
  "user_reels.php",
  "get_ig_user_feed.php"
];

async function tryEndpoint(endpoint, params) {
  try {
    const url = `https://instagram-scraper-stable-api.p.rapidapi.com/${endpoint}?${params}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-scraper-stable-api.p.rapidapi.com",
      }
    });
    if (res.status !== 404) {
      console.log(`[FOUND!] ${endpoint} - Status: ${res.status}`);
      const data = await res.json();
      console.log("Sample:", JSON.stringify(data).slice(0, 300));
    }
  } catch (e) {
    // Ignore errors
  }
}

async function run() {
  console.log("Probing endpoints on instagram-scraper-stable-api.p.rapidapi.com...");
  for (const ep of endpoints) {
    await tryEndpoint(ep, `username_or_url=${username}`);
  }
  console.log("Probe finished.");
}

run();
