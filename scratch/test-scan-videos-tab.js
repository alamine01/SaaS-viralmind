async function testScanVideosTab() {
  const handle = "Squeezie";
  const url = `https://www.youtube.com/@${handle}/videos`;
  
  console.log(`Fetching videos tab from ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  const posts = [];
  const blockRegex = /"watchEndpoint":\s*\{\s*"videoId"\s*:\s*"([^"]+)"[\s\S]*?"lockupMetadataViewModel":\s*\{\s*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"\s*\}\s*,\s*"metadata"\s*:\s*\{\s*"contentMetadataViewModel"\s*:\s*\{\s*"metadataRows"\s*:\s*\[\s*\{\s*"metadataParts"\s*:\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
  
  let match;
  let count = 0;
  while ((match = blockRegex.exec(html)) !== null && count < 10) {
    const videoId = match[1];
    const title = match[2];
    const viewsText = match[3];
    
    // Parsing du nombre de vues
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

    count++;
    posts.push({
      id: videoId,
      title: title,
      views: views,
      viewsText: viewsText,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
  }

  console.log(`\n==========================================`);
  console.log(`🎥 SCAN DES VIDÉOS LONG FORMAT POUR @${handle}`);
  console.log(`==========================================`);
  posts.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Titre: "${p.title.substring(0, 50)}..." | Vues : ${p.views.toLocaleString()} (Brut: "${p.viewsText}")`);
  });

  // Calculer médiane et outliers
  if (posts.length > 0) {
    const sortedViews = [...posts].map(p => p.views).sort((a, b) => a - b);
    const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1;
    console.log(`\nMédiane des vues : ${medianViews.toLocaleString()} vues`);

    console.log("\n--- BILAN DE LA DÉTECTION D'OUTLIERS (seuil x1.5) ---");
    posts.forEach((post) => {
      const outlierScore = parseFloat((post.views / medianViews).toFixed(1));
      const isOutlier = outlierScore >= 1.5;
      console.log(`[${isOutlier ? "🔥 OUTLIER" : "   NORMAL"}] Vues : ${post.views.toLocaleString()} (x${outlierScore} de la médiane) | "${post.title.substring(0, 50)}..."`);
    });
  }
}

testScanVideosTab();
