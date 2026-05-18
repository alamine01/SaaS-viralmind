const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testScraper() {
  const url = "https://www.tiktok.com/@mrbeast/video/7365691095904832811";
  const apiKey = process.env.RAPIDAPI_KEY; // Votre clé du .env
  
  try {
    console.log("Testing URL:", url);
    const host = "tiktok-video-no-watermark2.p.rapidapi.com";
    const apiUrl = `https://${host}/video/info?url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': host
      }
    });

    const data = await response.json();
    console.log("Full Data:", JSON.stringify(data, null, 2));
    
    const videoInfo = data.data || data;
    console.log("Title:", videoInfo.title);
    console.log("Music URL:", videoInfo.music);
    console.log("Play URL:", videoInfo.play);
    console.log("ID from API:", videoInfo.video_id || videoInfo.aweme_id);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testScraper();
