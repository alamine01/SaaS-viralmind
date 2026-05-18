const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runDirectTest(handle) {
  console.log(`\n=== HYBRID SCAN DE @${handle} (VIDÉOS ET SHORTS) ===`);

  try {
    let posts = [];
    let followers = 0;

    // --- LOGIQUE DE SCAN YOUTUBE ---
    // 1. Résolution de l'ID du canal et du nombre d'abonnés par scraping
    const ytUrl = `https://www.youtube.com/@${handle}`;
    console.log(`1. Récupération de l'HTML de la page YouTube @${handle}...`);
    const res = await fetch(ytUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    const html = await res.text();
    
    // Résolution du Channel ID canonique
    let channelId = null;
    const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
    if (canonicalMatch) {
      channelId = canonicalMatch[1];
    } else {
      const ogUrlMatch = html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
      if (ogUrlMatch) {
        channelId = ogUrlMatch[1];
      }
    }

    if (!channelId) {
      const channelIdMatch = html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/);
      if (channelIdMatch) channelId = channelIdMatch[1];
    }

    if (!channelId) {
      throw new Error("Impossible de trouver le Channel ID YouTube");
    }
    console.log(`   -> Channel ID canonique résolu : ${channelId}`);

    // Extraction du nombre d'abonnés par scraping
    let subText = "";
    const subRegex = /"metadataParts":\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
    let subMatch;
    while ((subMatch = subRegex.exec(html)) !== null) {
      const text = subMatch[1].toLowerCase();
      if (text.includes('abon') || text.includes('sub') || text.includes('mille')) {
        subText = text;
        break;
      }
    }

    if (subText) {
      const subLower = subText.toLowerCase();
      const numMatch = subLower.match(/([0-9,.\s ]+)/);
      if (numMatch) {
        let cleanNum = numMatch[1].replace(/[\s\u00a0]/g, '').trim();
        if (cleanNum.includes(',')) {
          const parts = cleanNum.split(',');
          if (parts[1].length < 3) {
            cleanNum = cleanNum.replace(',', '.');
          } else {
            cleanNum = cleanNum.replace(',', '');
          }
        }
        let val = parseFloat(cleanNum);
        if (subLower.includes('k') || subLower.includes('mille')) followers = val * 1000;
        else if (subLower.includes('m') || subLower.includes('million')) followers = val * 1000000;
        else followers = val;
      }
    }
    console.log(`   -> Abonnés extraits : ${followers.toLocaleString()} abonnés`);

    // 2. Scraping direct de la page /videos pour récupérer les vidéos longs formats
    console.log("\n2. Récupération des vidéos Long Format depuis l'onglet /videos...");
    const videosTabUrl = `https://www.youtube.com/@${handle}/videos`;
    try {
      const vRes = await fetch(videosTabUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const vHtml = await vRes.text();
      
      const blockRegex = /"watchEndpoint":\s*\{\s*"videoId"\s*:\s*"([^"]+)"[\s\S]*?"lockupMetadataViewModel":\s*\{\s*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"\s*\}\s*,\s*"metadata"\s*:\s*\{\s*"contentMetadataViewModel"\s*:\s*\{\s*"metadataRows"\s*:\s*\[\s*\{\s*"metadataParts"\s*:\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
      let vMatch;
      let longCount = 0;
      while ((vMatch = blockRegex.exec(vHtml)) !== null && longCount < 6) {
        const videoId = vMatch[1];
        const title = vMatch[2];
        const viewsText = vMatch[3];
        
        let views = 0;
        if (viewsText) {
          const cleanLower = viewsText.toLowerCase();
          const numMatch = cleanLower.match(/([0-9,.\s ]+)/);
          if (numMatch) {
            let cleanNum = numMatch[1].replace(/[\s\u00a0]/g, '').trim();
            if (cleanNum.includes(',')) {
              const parts = cleanNum.split(',');
              if (parts[1].length < 3) {
                cleanNum = cleanNum.replace(',', '.');
              } else {
                cleanNum = cleanNum.replace(',', '');
              }
            }
            let val = parseFloat(cleanNum);
            if (cleanLower.includes('k') || cleanLower.includes('mille')) {
              views = val * 1000;
            } else if (cleanLower.includes('m') || cleanLower.includes('million')) {
              views = val * 1000000;
            } else {
              views = val;
            }
          }
        }

        longCount++;
        posts.push({
          id: videoId,
          title: title,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          views: views,
          viewsText: viewsText,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          type: "LONG"
        });
      }
      console.log(`   -> ${longCount} vidéos Long Format récupérées avec succès.`);
    } catch (vErr) {
      console.error("Échec de l'onglet vidéos:", vErr.message);
    }

    // 3. Scraping du flux RSS pour y ajouter les Shorts les plus récents
    console.log("\n3. Récupération des Shorts récents depuis le flux RSS...");
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    try {
      const rssRes = await fetch(rssUrl);
      const rssText = await rssRes.text();
      
      const rssEntries = [];
      const entryRegex = /<entry>[\s\S]*?<yt:videoId>([\w-]+)<\/yt:videoId>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<\/entry>/g;
      let entryMatch;
      while ((entryMatch = entryRegex.exec(rssText)) !== null) {
        rssEntries.push({
          id: entryMatch[1],
          title: entryMatch[2].trim(),
          url: `https://www.youtube.com/watch?v=${entryMatch[1]}`
        });
      }

      let shortCount = 0;
      for (const entry of rssEntries.slice(0, 6)) {
        // Si la vidéo n'est pas déjà présente dans notre liste de vidéos longues, c'est un Short récent !
        if (!posts.some(p => p.id === entry.id)) {
          shortCount++;
          // Récupération des vues du Short
          const watchRes = await fetch(entry.url);
          const watchHtml = await watchRes.text();
          
          let views = 0;
          const viewMatch = watchHtml.match(/"viewCount":"(\d+)"/);
          if (viewMatch) views = parseInt(viewMatch[1]);
          
          if (!views) {
            const alternativeMatch = watchHtml.match(/(\d+)\s*views/i);
            if (alternativeMatch) views = parseInt(alternativeMatch[1]);
          }

          posts.push({
            id: entry.id,
            title: entry.title,
            thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
            views: views,
            viewsText: `${views.toLocaleString()} vues`,
            url: entry.url,
            type: "SHORT"
          });
        }
      }
      console.log(`   -> ${shortCount} Shorts récents ajoutés.`);
    } catch (rssErr) {
      console.error("Échec RSS:", rssErr.message);
    }

    // --- ALGORITHME DE CALCUL D'OUTLIER ---
    if (posts.length > 0) {
      console.log("\n4. Calcul de la médiane et détection d'outliers...");
      
      // On calcule des médianes séparées pour que ce soit 100% exact (les Shorts ont des vues différentes des vidéos longues)
      const longPosts = posts.filter(p => p.type === "LONG");
      const shortPosts = posts.filter(p => p.type === "SHORT");

      console.log(`\n==========================================`);
      console.log(`🎥 ANALYSE COMPLETE POUR @${handle}`);
      console.log(`==========================================`);

      if (longPosts.length > 0) {
        const sortedLong = [...longPosts].map(p => p.views).sort((a, b) => a - b);
        const medianLong = sortedLong[Math.floor(sortedLong.length / 2)] || 1;
        console.log(`\nMédiane des vidéos LONG FORMAT : ${medianLong.toLocaleString()} vues`);
        
        longPosts.forEach((post) => {
          const score = parseFloat((post.views / medianLong).toFixed(1));
          const isOutlier = score >= 1.5;
          console.log(`[${isOutlier ? "🔥 PÉPITE LONGUE" : "   NORMAL LONG "}] Vues : ${post.views.toLocaleString()} (x${score} de la médiane) | "${post.title.substring(0, 45)}..."`);
        });
      }

      if (shortPosts.length > 0) {
        const sortedShort = [...shortPosts].map(p => p.views).sort((a, b) => a - b);
        const medianShort = sortedShort[Math.floor(sortedShort.length / 2)] || 1;
        console.log(`\nMédiane des SHORTS : ${medianShort.toLocaleString()} vues`);
        
        shortPosts.forEach((post) => {
          const score = parseFloat((post.views / medianShort).toFixed(1));
          const isOutlier = score >= 2.0;
          console.log(`[${isOutlier ? "🔥 PÉPITE SHORT " : "   NORMAL SHORT"}] Vues : ${post.views.toLocaleString()} (x${score} de la médiane) | "${post.title.substring(0, 45)}..."`);
        });
      }

    } else {
      console.error("Aucune vidéo n'a pu être analysée.");
    }

  } catch (err) {
    console.error("❌ ERREUR DE SCAN :", err.message);
  }
}

async function start() {
  await runDirectTest("Squeezie");
}

start();
