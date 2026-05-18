async function findMainChannelId() {
  const handle = "Squeezie";
  const ytUrl = `https://www.youtube.com/@${handle}`;
  
  console.log(`Fetching HTML from ${ytUrl}...`);
  const res = await fetch(ytUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  console.log("\n--- CANONICAL / META TAG SEARCH FOR MAIN CHANNEL ID ---");
  
  // 1. Rel canonical check
  const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
  console.log("Rel Canonical Match:", canonicalMatch ? canonicalMatch[1] : "Not found");

  // 2. og:url check
  const ogUrlMatch = html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
  console.log("OG URL Match:", ogUrlMatch ? ogUrlMatch[1] : "Not found");

  // 3. itemprop="channelId" check
  const itempropMatch = html.match(/<meta itemprop="channelId" content="(UC[A-Za-z0-9_-]{22})"/);
  console.log("itemprop ChannelID Match:", itempropMatch ? itempropMatch[1] : "Not found");

  // 4. twitter:url check
  const twitterMatch = html.match(/<meta name="twitter:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/);
  console.log("Twitter URL Match:", twitterMatch ? twitterMatch[1] : "Not found");

  // Let's verify what Squeezie's main channel ID actually is by doing a check
  // Squeezie's main channel ID is UCafxR2HWJRmMfSdyZXvZMTw (let's check if it matches!)
  console.log("\nExpected Main Channel ID of Squeezie: UCafxR2HWJRmMfSdyZXvZMTw");
}

findMainChannelId();
