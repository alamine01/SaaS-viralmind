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

  console.log("\nParsing videos with views from the /videos HTML...");

  const blockRegex = /"watchEndpoint":\s*\{\s*"videoId"\s*:\s*"([^"]+)"[\s\S]*?"lockupMetadataViewModel":\s*\{\s*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"\s*\}\s*,\s*"metadata"\s*:\s*\{\s*"contentMetadataViewModel"\s*:\s*\{\s*"metadataRows"\s*:\s*\[\s*\{\s*"metadataParts"\s*:\s*\[\s*\{\s*"text"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"/g;
  
  let match;
  let count = 0;
  while ((match = blockRegex.exec(html)) !== null && count < 10) {
    count++;
    const videoId = match[1];
    const title = match[2];
    const viewsText = match[3];
    console.log(`[${count}] ID: ${videoId} | Title: ${title} | Views: ${viewsText}`);
  }
}

parseVideosTab();
