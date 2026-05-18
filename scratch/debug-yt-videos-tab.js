async function testVideosTab() {
  const handle = "Squeezie";
  const url = `https://www.youtube.com/@${handle}/videos`;
  
  console.log(`Fetching videos tab from ${url}...`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  console.log("\nSearching for video titles in /videos page...");
  
  // Squeezie's long form videos from the screenshot:
  // "QUI TROUVERA LE MEILLEUR CONTAINER"
  // "DES INCONNUS NOUS JUGENT"
  
  const target = "CONTAINER";
  const index = html.indexOf(target);
  if (index !== -1) {
    console.log(`Found '${target}' at position ${index}!`);
    console.log("Snippet:\n", html.substring(index - 150, index + 150));
  } else {
    console.log(`Could not find '${target}' in the HTML!`);
  }

  // Let's find videoRenderer patterns
  const videoRendererMatch = html.match(/"videoRenderer":\s*\{/g);
  console.log(`Number of 'videoRenderer' matches found:`, videoRendererMatch ? videoRendererMatch.length : 0);

  // Let's see if we can parse the video titles, views and IDs from videoRenderer
  const regex = /"videoRenderer":\s*\{"videoId"\s*:\s*"([^"]+)"[\s\S]*?"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/g;
  let match;
  let count = 0;
  console.log("\nExtracted videos:");
  while ((match = regex.exec(html)) !== null && count < 10) {
    count++;
    console.log(`[${count}] ID: ${match[1]} | Title: ${match[2]}`);
  }
}

testVideosTab();
