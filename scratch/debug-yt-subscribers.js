async function debugSubs() {
  const handle = "BenjaminCode";
  const ytUrl = `https://www.youtube.com/@${handle}`;
  
  console.log(`Fetching HTML from ${ytUrl}...`);
  const res = await fetch(ytUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  console.log("\n--- SEARCHING FOR SUBSCRIBERS IN HTML ---");
  
  // Find "subscriberCountText" or related phrases
  const index = html.indexOf("subscriberCountText");
  if (index !== -1) {
    console.log("Found subscriberCountText in HTML!");
    console.log("Snippet around subscriberCountText:\n", html.substring(index - 100, index + 300));
  } else {
    console.log("subscriberCountText not found in HTML!");
  }

  // Let's find matches for subscriber count
  const matches = html.match(/"subscriberCountText":\s*\{[^\}]+\}/g);
  if (matches) {
    console.log("\nMatches for subscriberCountText:");
    matches.forEach((m, idx) => console.log(`[${idx}]`, m));
  }

  // Let's look for "158" or "abonnés" in simple text or simpleText
  const abonneMatches = html.match(/"[^"]*abonnés[^"]*"/g) || html.match(/"[^"]*subscribers[^"]*"/g);
  if (abonneMatches) {
    console.log("\nMatches containing 'abonnés' or 'subscribers':");
    abonneMatches.slice(0, 10).forEach((m, idx) => console.log(`[${idx}]`, m));
  }
}

debugSubs();
