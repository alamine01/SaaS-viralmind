const dotenv = require("dotenv");
const path = require("path");

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey = process.env.RAPIDAPI_KEY;
const username = "yomi.denzel";

async function testScraperA() {
  console.log("=== Testing Scraper A ===");
  try {
    const url = `https://instagram-public-bulk-scraper.p.rapidapi.com/v1/user_reels?username_or_id=${username}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-public-bulk-scraper.p.rapidapi.com",
      }
    });
    console.log("Scraper A Status:", res.status);
    const data = await res.json();
    console.log("Scraper A Data Keys:", Object.keys(data));
    if (data.data) {
      console.log("Scraper A data field Keys:", Object.keys(data.data));
      console.log("Scraper A items count:", data.data.items?.length);
    } else {
      console.log("Scraper A Response sample:", JSON.stringify(data).slice(0, 500));
    }
  } catch (e) {
    console.error("Scraper A failed:", e);
  }
}

async function testScraperB() {
  console.log("\n=== Testing Scraper B ===");
  try {
    const url = `https://instagram-bulk-scraper-latest.p.rapidapi.com/v1/user_reels?username_or_id=${username}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "instagram-bulk-scraper-latest.p.rapidapi.com",
      }
    });
    console.log("Scraper B Status:", res.status);
    const data = await res.json();
    console.log("Scraper B Response sample:", JSON.stringify(data).slice(0, 500));
  } catch (e) {
    console.error("Scraper B failed:", e);
  }
}

async function run() {
  await testScraperA();
  await testScraperB();
}

run();
