async function testVideosId() {
  const handle = "Squeezie";
  const url = `https://www.youtube.com/@${handle}/videos`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  const target = "QUI TROUVERA LE MEILLEUR CONTAINER";
  const index = html.indexOf(target);
  if (index !== -1) {
    console.log("Found target! Printing 2500 characters before the title:");
    const sub = html.substring(index - 2500, index);
    
    // Find all occurrences of "videoId" or "watchEndpoint" in this sub
    let pos = 0;
    while (true) {
      const idx = sub.indexOf("videoId", pos);
      if (idx === -1) break;
      console.log(`\nFound 'videoId' at index ${idx}:`);
      console.log(sub.substring(idx - 50, idx + 100));
      pos = idx + 1;
    }
    
    // Let's print the watchEndpoint matches
    pos = 0;
    while (true) {
      const idx = sub.indexOf("watchEndpoint", pos);
      if (idx === -1) break;
      console.log(`\nFound 'watchEndpoint' at index ${idx}:`);
      console.log(sub.substring(idx - 50, idx + 150));
      pos = idx + 1;
    }

  } else {
    console.log("Target not found!");
  }
}

testVideosId();
