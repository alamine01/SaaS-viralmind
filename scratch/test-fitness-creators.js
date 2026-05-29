const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.RAPIDAPI_KEY;

const users = ["sissymua", "nassim_sahili"];

async function testUser(username) {
  try {
    const url = `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user_reels?username_or_id=${username}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-public-bulk-scraper.p.rapidapi.com",
      }
    });
    const data = await res.json();
    console.log(`Username: ${username} -> Status: ${res.status}, Message: ${data.message || 'OK'}, Items: ${data.data?.items?.length || 0}`);
  } catch (e) {
    console.error(`Failed for ${username}:`, e.message);
  }
}

async function run() {
  for (const user of users) {
    await testUser(user);
    await new Promise(r => setTimeout(r, 500));
  }
}

run();
