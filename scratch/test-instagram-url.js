const apiKey = "b2fc00412fmsh8a0cdf48e63cb25p15d87ejsneac7c37d9d90";

async function testInsta() {
  const url = "https://www.instagram.com/reel/DYASoMYsqfc/";
  console.log("Calling instagram-scraper-stable-api...");
  try {
    const infoUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php?reel_post_code_or_url=${encodeURIComponent(url)}&type=reel`;
    const response = await fetch(infoUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': "instagram-scraper-stable-api.p.rapidapi.com"
      }
    });
    console.log("Status:", response.status);
    if (response.ok) {
      const result = await response.json();
      console.log("Response Keys:", Object.keys(result));
      const item = result.data || result.body || result;
      console.log("Item Keys:", Object.keys(item));
      console.log("video_url:", item.video_url);
      console.log("videoUrl:", item.videoUrl);
      console.log("video_versions:", item.video_versions);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testInsta();
