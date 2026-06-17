const apiKey = "b2fc00412fmsh8a0cdf48e63cb25p15d87ejsneac7c37d9d90";

async function testYTApi() {
  const videoId = "dQw4w9WgXcQ"; // Rickroll
  
  // Test 1: yt-api.p.rapidapi.com
  try {
    console.log("Testing yt-api.p.rapidapi.com...");
    const res = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${videoId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
      }
    });
    console.log("yt-api status:", res.status);
    const data = await res.json();
    console.log("yt-api data sample:", JSON.stringify(data).substring(0, 500));
  } catch (err) {
    console.error("yt-api error:", err);
  }

  // Test 2: youtube-media-downloader.p.rapidapi.com
  try {
    console.log("\nTesting youtube-media-downloader.p.rapidapi.com...");
    const res = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${videoId}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com'
      }
    });
    console.log("youtube-media-downloader status:", res.status);
    const data = await res.json();
    console.log("youtube-media-downloader data sample:", JSON.stringify(data).substring(0, 500));
  } catch (err) {
    console.error("youtube-media-downloader error:", err);
  }
}

testYTApi();
