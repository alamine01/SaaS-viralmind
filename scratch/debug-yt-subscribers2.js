async function debugSubs2() {
  const handle = "BenjaminCode";
  const ytUrl = `https://www.youtube.com/@${handle}`;
  
  const res = await fetch(ytUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, with Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  console.log("\n--- SEARCHING FOR '158' OR SUBSCRIBERS IN @BenjaminCode HTML ---");

  // Let's search for "158" (since he has 158k subscribers)
  let pos = 0;
  while (true) {
    const idx = html.indexOf("158", pos);
    if (idx === -1) break;
    console.log(`\nFound '158' at position ${idx}:`);
    console.log(html.substring(idx - 100, idx + 200));
    pos = idx + 1;
    if (pos > html.length || pos > 500000) break; // limit output
  }
}

debugSubs2();
