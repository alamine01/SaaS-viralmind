const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apifyToken = process.env.APIFY_API_TOKEN;
const apiKey = process.env.RAPIDAPI_KEY;

async function testInstagram(username) {
  console.log(`\n=== TEST INSTAGRAM: @${username} (via Apify) ===`);
  if (!apifyToken) {
    console.log("Erreur: APIFY_API_TOKEN absent");
    return;
  }

  const actor = "apify~instagram-profile-scraper";
  const apifyUrl = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${apifyToken}`;
  
  try {
    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "usernames": [username],
        "resultsLimit": 1
      })
    });
    
    if (response.ok) {
      const items = await response.json();
      if (items.length > 0) {
        const profile = items[0];
        console.log(`Nom complet: ${profile.fullName || 'N/A'}`);
        console.log(`Abonnés (Followers): ${profile.followersCount.toLocaleString()}`);
        console.log(`Nombre total de posts: ${profile.postsCount}`);
        
        const posts = profile.latestPosts || [];
        console.log(`\nLes ${posts.length} derniers posts récupérés :`);
        posts.slice(0, 5).forEach((p, idx) => {
          const views = p.videoPlayCount || p.playCount || p.videoViewCount || 0;
          console.log(`  [${idx + 1}] Type: ${p.type} | Vues: ${views.toLocaleString()} | Shortcode: ${p.shortCode}`);
          console.log(`      Lien: https://www.instagram.com/reel/${p.shortCode}/`);
        });
      } else {
        console.log("Aucune donnée de profil trouvée.");
      }
    } else {
      console.log("Échec de l'appel Apify. Status:", response.status);
    }
  } catch (e) {
    console.log("Erreur lors du test Instagram:", e.message);
  }
}

async function testTikTok(username) {
  console.log(`\n=== TEST TIKTOK: @${username} (via RapidAPI) ===`);
  if (!apiKey) {
    console.log("Erreur: RAPIDAPI_KEY absent");
    return;
  }

  const host = "tiktok-video-no-watermark2.p.rapidapi.com";
  let followersCount = 0;

  try {
    // 1. Récupérer les infos de l'utilisateur (Abonnés)
    console.log("Récupération des infos utilisateur (Abonnés)...");
    const userApiUrl = `https://${host}/user/info?unique_id=${username}`;
    const userRes = await fetch(userApiUrl, {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host }
    });
    
    if (userRes.ok) {
      const userData = await userRes.json();
      const stats = userData.data?.stats || userData.data || {};
      followersCount = stats.followerCount || stats.follower_count || stats.followers || 0;
      console.log(`Abonnés (Followers) trouvés: ${followersCount.toLocaleString()}`);
    } else {
      console.log("Échec de la récupération des abonnés.");
    }

    // 2. Récupérer les posts
    console.log("\nRécupération des 5 derniers posts...");
    const postsRes = await fetch(`https://${host}/user/posts?unique_id=${username}&count=5`, {
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': host }
    });
    
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      const videos = postsData.data?.videos || postsData.videos || postsData.data || [];
      console.log(`Nombre de vidéos trouvées: ${videos.length}`);
      videos.forEach((v, idx) => {
        const views = parseInt(v.play_count || v.view_count || "0");
        console.log(`  [${idx + 1}] ID: ${v.video_id} | Vues: ${views.toLocaleString()}`);
        console.log(`      Lien: https://www.tiktok.com/@${username}/video/${v.video_id}`);
      });
    } else {
      console.log("Échec de la récupération des posts.");
    }
  } catch (e) {
    console.log("Erreur lors du test TikTok:", e.message);
  }
}

async function run() {
  await testInstagram("tiboinshape");
  await testTikTok("tiboinshape");
}

run();
