const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.RAPIDAPI_KEY;

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
    console.log(`Username: ${username} -> Status: ${res.status}, Response Keys:`, Object.keys(data));
    if (data.data) {
      console.log(`Username: ${username} -> items count:`, data.data.items?.length);
    } else {
      console.log(`Username: ${username} -> Error response:`, JSON.stringify(data));
    }
  } catch (e) {
    console.error(`Failed for ${username}:`, e.message);
  }
}

async function run() {
  await testUser("yomidenzel");
  await testUser("276464650");
}

run();
