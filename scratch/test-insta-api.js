const API_KEY = "b2fc00412fmsh8a0cdf48e63cb25p15d87ejsneac7c37d9d90";
const HOST = "instagram-scraper-stable-api.p.rapidapi.com";
const REEL_URL = "https://www.instagram.com/reel/C8IEGXTN45s/";

async function test() {
  console.log("--- TEST USER INFO ---");
  const userRes = await fetch(`https://${HOST}/get_ig_user_info.php`, {
    method: 'POST',
    headers: { 
      'X-RapidAPI-Key': API_KEY, 
      'X-RapidAPI-Host': HOST,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username_or_url: "kaaramoo"
    })
  });
  const userData = await userRes.json();
  console.log("User Status:", userRes.status);
  console.log("Data reçue:", JSON.stringify(userData).substring(0, 500) + "...");
}

test();
