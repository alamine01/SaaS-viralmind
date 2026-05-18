const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;
const apiKey = process.env.RAPIDAPI_KEY;

async function testInstagram(username) {
  console.log(`\n=== TEST INSTAGRAM PARALLÈLE: @${username} ===`);
  if (!apifyToken) {
    console.log("Erreur: APIFY_API_TOKEN absent");
    return;
  }

  const profileActor = "apify~instagram-profile-scraper";
  const postsActor = "apify~instagram-scraper";
  
  const profileUrl = `https://api.apify.com/v2/acts/${profileActor}/run-sync-get-dataset-items?token=${apifyToken}`;
  const postsUrl = `https://api.apify.com/v2/acts/${postsActor}/run-sync-get-dataset-items?token=${apifyToken}`;

  try {
    const [profileRes, postsRes] = await Promise.all([
      fetch(profileUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "usernames": [username],
          "resultsLimit": 1
        })
      }),
      fetch(postsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "directUrls": [`https://www.instagram.com/${username}/`],
          "resultsLimit": 5
        })
      })
    ]);

    if (profileRes.ok && postsRes.ok) {
      const [profileData, postsData] = await Promise.all([
        profileRes.json(),
        postsRes.json()
      ]);

      if (profileData.length > 0) {
        console.log(`Abonnés (Followers) via profil: ${profileData[0].followersCount.toLocaleString()}`);
      }
      
      console.log(`\nLes ${postsData.length} derniers posts récupérés avec Plays réels :`);
      postsData.forEach((p, idx) => {
        const views = p.videoPlayCount || p.playCount || p.videoViewCount || 0;
        console.log(`  [${idx + 1}] Type: ${p.type} | Vues réelles (Plays): ${views.toLocaleString()} | Shortcode: ${p.shortCode}`);
        console.log(`      Lien: https://www.instagram.com/reel/${p.shortCode}/`);
      });
    } else {
      console.log("Failed. Statuses:", profileRes.status, postsRes.status);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function testTikTok(username) {
  console.log(`\n=== TEST TIKTOK SECONDAIRE: @${username} ===`);
  if (!apiKey) {
    console.log("Erreur: RAPIDAPI_KEY absent");
    return;
  }

  const host = "tiktok-video-no-watermark2.p.rapidapi.com";
  let followersCount = 0;

  try {
    // 1. Récupérer les abonnés
    const userApiUrl = `https://${host}/user/info?unique_id=${username}`;
    const userRes = await fetch(userApiUrl, {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host }
    });
    
    if (userRes.ok) {
      const userData = await userRes.json();
      const stats = userData.data?.stats || userData.data || {};
      followersCount = stats.followerCount || stats.follower_count || stats.followers || 0;
      console.log(`Abonnés (Followers) trouvés: ${followersCount.toLocaleString()}`);
    }

    // 2. Récupérer les posts
    const postsRes = await fetch(`https://${host}/user/posts?unique_id=${username}&count=5`, {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host }
    });
    
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      const videos = postsData.data?.videos || postsData.videos || postsData.data || [];
      console.log(`\nLes ${videos.length} derniers posts récupérés :`);
      videos.forEach((v, idx) => {
        const views = parseInt(v.play_count || v.view_count || "0");
        console.log(`  [${idx + 1}] ID: ${v.video_id} | Vues: ${views.toLocaleString()}`);
        console.log(`      Lien: https://www.tiktok.com/@${username}/video/${v.video_id}`);
      });
    }
  } catch (e) {
    console.log("Erreur TikTok:", e.message);
  }
}

async function run() {
  await testInstagram("khaby00");
  await testTikTok("khaby.lame");
}

run();
