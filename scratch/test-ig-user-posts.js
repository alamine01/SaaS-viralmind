const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkDetails() {
  const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
  const url = `https://${instaHost}/get_ig_user_posts.php`;
  
  const options = {
    method: 'POST',
    headers: { 
      'X-RapidAPI-Key': apiKey || "", 
      'X-RapidAPI-Host': instaHost,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ username_or_url: 'leomessi' })
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    console.log("\n=================================");
    console.log("Root Response Keys:", Object.keys(data));
    
    const posts = data.posts || [];
    console.log("Number of posts found:", posts.length);
    if (posts.length > 0) {
      const first = posts[0];
      console.log("Keys in first post object:", Object.keys(first));
      const node = first.node || first;
      console.log("Keys in post node:", Object.keys(node));
      console.log("Post Caption Text:", node.caption?.text || "None");
      console.log("Post Views Count:", node.video_view_count || node.video_play_count || node.play_count || "None");
      console.log("Post Shortcode/ID:", node.code || node.id || "None");
      console.log("User object in node:", node.user ? JSON.stringify(node.user) : "None");
    }
    console.log("=================================");
  } catch (e) {
    console.log("Failed to fetch details:", e.message);
  }
}

checkDetails();
