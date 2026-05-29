const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const apiKey = process.env.RAPIDAPI_KEY;

const usernames = [
  "karamo_officiel",
  "dr_dremax",
  "davidlarochefr",
  "yomidenzel",
  "yann_darwin",
  "micode",
  "tech_in_seconds",
  "valouzz",
  "lenasituations",
  "tiboinshape",
  "sissy_mua",
  "finance_facile",
  "mister_v",
  "paulmirabel",
  "hugodecrypte",
  "cuisine_rapide",
  "gotaga",
  "inoxtag"
];

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
  console.log("Starting batch test of dot-free creators...");
  for (const user of usernames) {
    await testUser(user);
    // 500ms delay to avoid rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  console.log("Batch test completed.");
}

run();
