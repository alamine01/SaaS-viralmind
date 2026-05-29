const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.RAPIDAPI_KEY;
const username = "yomi.denzel";

async function tryEndpoint(endpoint, params) {
  console.log(`\n--- Trying: ${endpoint} ---`);
  try {
    const url = `https://instagram-scraper-stable-api.p.rapidapi.com/${endpoint}?${params}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-scraper-stable-api.p.rapidapi.com",
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response sample:", JSON.stringify(data).slice(0, 400));
  } catch (e) {
    console.error(`Failed ${endpoint}:`, e.message);
  }
}

async function run() {
  await tryEndpoint("get_user_reels.php", `username_or_url=${username}`);
  await tryEndpoint("get_user_posts.php", `username_or_url=${username}`);
  await tryEndpoint("get_ig_user_posts.php", `username_or_url=${username}`);
}

run();
