async function parseVideosTab() {
  const handle = "Squeezie";
  const url = `https://www.youtube.com/@${handle}/videos`;
  
  console.log(`Fetching videos tab from ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  console.log("\nParsing videos from the /videos HTML...");

  // Nous allons chercher les structures "lockupMetadataViewModel" et reculer ou avancer pour trouver le videoId
  // Une autre technique extrêmement simple et 100% fiable :
  // Rechercher toutes les occurrences de "lockupMetadataViewModel"
  const videos = [];
  
  // Utilisons une regex pour isoler chaque bloc de vidéo
  // Chaque bloc commence par un watchEndpoint et se termine par lockupMetadataViewModel
  const blockRegex = /"watchEndpoint":\s*\{\s*"videoId"\s*:\s*"([^"]+)"[\s\S]*?"lockupMetadataViewModel":\s*\{\s*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
  
  let match;
  let count = 0;
  while ((match = blockRegex.exec(html)) !== null && count < 10) {
    const videoId = match[1];
    const title = match[2];
    
    // Recherchons le nombre de vues dans le bloc suivant la correspondance
    const searchArea = html.substring(match.index, match.index + 3000);
    const viewMatch = searchArea.match(/"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"\s*\}\s*\}\s*,\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"il y a/);
    let viewsText = viewMatch ? viewMatch[1] : "";
    
    if (!viewsText) {
      const altViewMatch = searchArea.match(/"content"\s*:\s*"([0-9,.\s ]+[kKmM]?(?: | )?de vues|views)"/);
      if (altViewMatch) viewsText = altViewMatch[1];
    }

    count++;
    videos.push({ id: videoId, title, viewsText });
    console.log(`[${count}] ID: ${videoId} | Title: ${title} | Views: ${viewsText}`);
  }
}

parseVideosTab();
