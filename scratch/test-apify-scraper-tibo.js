const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkScraperPosts() {
  if (!apifyToken) return;

  const actor = "apify~instagram-scraper";
  const apifyUrl = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}`;
  
  try {
    console.log("Calling apify/instagram-scraper for tiboinshape...");
    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "directUrls": ["https://www.instagram.com/p/DYZV9qoMB65/"],
        "resultsLimit": 1
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      if (items.length > 0) {
        const post = items[0];
        console.log("Keys in post:", Object.keys(post).join(", "));
        console.log("Shortcode:", post.shortCode);
        console.log("Caption:", post.caption ? post.caption.substring(0, 60) : 'None');
        console.log("videoViewCount:", post.videoViewCount);
        console.log("videoPlayCount:", post.videoPlayCount);
        console.log("playCount:", post.playCount);
        console.log("likesCount:", post.likesCount);
      } else {
        console.log("No items found.");
      }
    } else {
      console.log("Failed. Status:", response.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkScraperPosts();
