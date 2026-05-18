const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkLatestPosts() {
  if (!apifyToken) return;

  const actor = "apify~instagram-profile-scraper";
  const apifyUrl = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}`;
  
  try {
    console.log("Calling Apify for latest posts of tiboinshape...");
    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "usernames": ["tiboinshape"],
        "resultsLimit": 1
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      if (items.length > 0) {
        const profile = items[0];
        const posts = profile.latestPosts || [];
        console.log("Number of latest posts:", posts.length);
        posts.slice(0, 10).forEach((p, idx) => {
          console.log(`\nPost [${idx + 1}]:`);
          console.log(`  Shortcode: ${p.shortCode}`);
          console.log(`  Caption: ${p.caption ? p.caption.substring(0, 60) : 'None'}`);
          console.log(`  videoPlayCount: ${p.videoPlayCount}`);
          console.log(`  videoViewCount: ${p.videoViewCount}`);
          console.log(`  playCount: ${p.playCount}`);
          console.log(`  views: ${p.views}`);
          console.log(`  likesCount: ${p.likesCount}`);
        });
      }
    } else {
      console.log("Failed. Status:", response.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkLatestPosts();
