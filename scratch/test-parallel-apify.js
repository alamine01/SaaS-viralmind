const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;

async function checkParallel() {
  if (!apifyToken) return;

  const profileActor = "apify~instagram-profile-scraper";
  const postsActor = "apify~instagram-scraper";
  
  const profileUrl = `https://api.apify.com/v2/acts/${profileActor}/run-sync-get-dataset-items?token=${apifyToken}`;
  const postsUrl = `https://api.apify.com/v2/acts/${postsActor}/run-sync-get-dataset-items?token=${apifyToken}`;

  console.log("Starting parallel Apify requests...");
  const startTime = Date.now();

  try {
    const [profileRes, postsRes] = await Promise.all([
      fetch(profileUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "usernames": ["tiboinshape"],
          "resultsLimit": 1
        })
      }),
      fetch(postsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "directUrls": ["https://www.instagram.com/tiboinshape/"],
          "resultsLimit": 10
        })
      })
    ]);

    if (profileRes.ok && postsRes.ok) {
      const [profileData, postsData] = await Promise.all([
        profileRes.json(),
        postsRes.json()
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\nSUCCESS! Duration: ${duration}s`);
      
      if (profileData.length > 0) {
        console.log(`Followers count: ${profileData[0].followersCount.toLocaleString()}`);
      }
      
      console.log(`Number of posts returned: ${postsData.length}`);
      postsData.slice(0, 5).forEach((p, idx) => {
        const views = p.videoPlayCount || p.playCount || p.videoViewCount || 0;
        console.log(`  [${idx + 1}] Shortcode: ${p.shortCode} | Vues (Plays): ${views.toLocaleString()}`);
      });
    } else {
      console.log("Failed. Statuses:", profileRes.status, postsRes.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkParallel();
