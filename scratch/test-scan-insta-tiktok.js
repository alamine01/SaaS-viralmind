const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function testInstagram(handle) {
  console.log(`\n=== 📸 TEST SCAN INSTAGRAM : @${handle} ===`);
  try {
    const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
    console.log(`Appel de l'API de scraping Instagram pour @${handle}...`);
    
    const instaRes = await fetch(`https://${instaHost}/get_ig_user_info.php`, {
      method: 'POST',
      headers: { 
        'X-RapidAPI-Key': apiKey || "", 
        'X-RapidAPI-Host': instaHost,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username_or_url: handle
      })
    });
    
    const instaData = await instaRes.json();
    const user = instaData.data || instaData.user || instaData;
    
    if (!user) {
      throw new Error("Aucune donnée utilisateur retournée par l'API.");
    }

    const followers = parseInt(user.follower_count || user.followers || user.edge_followed_by?.count || "0");
    console.log(`-> Abonnés extraits : ${followers.toLocaleString()} abonnés`);

    const mediaEdges = user.edge_owner_to_timeline_media?.edges || user.media?.nodes || user.items || [];
    console.log(`-> Nombre de publications trouvées : ${mediaEdges.length}`);

    const posts = mediaEdges.map((edge) => {
      const node = edge.node || edge;
      const shortcode = node.shortcode || node.code || "";
      let views = parseInt(node.play_count || node.video_play_count || node.video_view_count || "0");
      
      if (views === 0 && node.edge_liked_by?.count) {
        // Fallback sur les likes si pas de play count (pour les photos simples)
        views = parseInt(node.edge_liked_by.count) * 4; // Estimation standard du reach
      }

      return {
        id: shortcode,
        views: views,
        thumbnail: node.display_url || node.thumbnail_src || "",
        url: `https://www.instagram.com/reel/${shortcode}/`
      };
    }).filter((p) => p.views > 0).slice(0, 10);

    if (posts.length > 0) {
      const sortedViews = [...posts].map(p => p.views).sort((a, b) => a - b);
      const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1;
      console.log(`-> Médiane des vues/reach : ${medianViews.toLocaleString()} vues`);

      console.log("\n--- BILAN DES PUBLICATIONS INSTAGRAM ---");
      posts.forEach((post, idx) => {
        const score = parseFloat((post.views / medianViews).toFixed(1));
        const isOutlier = score >= 2.0; // Seuil standard
        console.log(`[${isOutlier ? "🔥 PÉPITE" : "  NORMAL"}] Post #${idx+1} (${post.id}) | Vues : ${post.views.toLocaleString()} (x${score} de la médiane)`);
      });
    } else {
      console.log("Aucun post exploitable trouvé.");
    }
  } catch (err) {
    console.error("❌ ERREUR INSTAGRAM :", err.message);
  }
}

async function testTikTok(handle) {
  console.log(`\n=== 🎵 TEST SCAN TIKTOK : @${handle} ===`);
  try {
    const tiktokHost = "tiktok-video-no-watermark2.p.rapidapi.com";
    console.log(`Appel de l'API de scraping TikTok pour @${handle}...`);

    const tiktokRes = await fetch(`https://${tiktokHost}/user/posts?unique_id=${handle.replace("@", "")}&count=10`, {
      headers: { 
        'X-RapidAPI-Key': apiKey || "", 
        'X-RapidAPI-Host': tiktokHost 
      }
    });
    
    const tiktokData = await tiktokRes.json();
    const videosList = tiktokData.data?.videos || tiktokData.videos || tiktokData.data || [];
    
    console.log(`-> Nombre de vidéos trouvées : ${videosList.length}`);

    let followers = 0;
    if (videosList.length > 0) {
      const firstVideo = videosList[0];
      followers = parseInt(firstVideo.author?.follower_count || firstVideo.author?.followers || "0");
    }
    console.log(`-> Abonnés extraits : ${followers.toLocaleString()} abonnés`);

    const posts = videosList.map((v) => ({
      id: v.video_id || v.aweme_id,
      views: parseInt(v.play_count || v.view_count || "0"),
      thumbnail: v.cover || v.origin_cover || "",
      url: `https://www.tiktok.com/@${handle.replace("@", "")}/video/${v.video_id || v.aweme_id}`
    })).slice(0, 10);

    if (posts.length > 0) {
      const sortedViews = [...posts].map(p => p.views).sort((a, b) => a - b);
      const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1;
      console.log(`-> Médiane des vues : ${medianViews.toLocaleString()} vues`);

      console.log("\n--- BILAN DES VIDÉOS TIKTOK ---");
      posts.forEach((post, idx) => {
        const score = parseFloat((post.views / medianViews).toFixed(1));
        const isOutlier = score >= 2.0;
        console.log(`[${isOutlier ? "🔥 PÉPITE" : "  NORMAL"}] Vidéo #${idx+1} (${post.id}) | Vues : ${post.views.toLocaleString()} (x${score} de la médiane)`);
      });
    } else {
      console.log("Aucune vidéo exploitable trouvée.");
    }
  } catch (err) {
    console.error("❌ ERREUR TIKTOK :", err.message);
  }
}

async function start() {
  // Testons avec deux créateurs français populaires
  // Squeezie sur Instagram et Tibo InShape sur TikTok
  await testInstagram("squeezie");
  await testTikTok("tiboinshape");
}

start();
