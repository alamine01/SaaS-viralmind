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
    console.log("Calling Apify for latest posts...");
    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "usernames": ["moustapha.pb"],
        "resultsLimit": 1
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      if (items.length > 0) {
        const profile = items[0];
        console.log("Followers:", profile.followersCount);
        const posts = profile.latestPosts || [];
        console.log("Number of latest posts:", posts.length);
        if (posts.length > 0) {
          const first = posts[0];
          console.log("Keys in first post:", Object.keys(first).join(", "));
          console.log("Post ID:", first.id);
          console.log("Post Shortcode:", first.shortCode);
          console.log("Post View Count:", first.videoViewCount || first.videoPlayCount || first.playCount);
          console.log("Post Type:", first.type);
        }
      }
    } else {
      console.log("Failed. Status:", response.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkLatestPosts();
