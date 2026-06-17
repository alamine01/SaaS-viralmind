async function testDistribute() {
  const url = "https://www.ddinstagram.com/reel/DYASoMYsqfc/";
  console.log("Fetching ddinstagram HTML...");
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    // Search for video meta tag or source tag
    const ogVideo = html.match(/property="og:video" content="([^"]+)"/);
    if (ogVideo) {
      console.log("Found og:video:", ogVideo[1]);
    } else {
      console.log("No og:video tag. Searching for standard mp4 links...");
      const mp4s = html.match(/https:\/\/[^"]+\.mp4[^"]*/g);
      console.log("Found mp4 links:", mp4s ? mp4s.slice(0, 3) : "none");
    }
  } catch (e) {
    console.error("Failed:", e.message);
  }
}

testDistribute();
