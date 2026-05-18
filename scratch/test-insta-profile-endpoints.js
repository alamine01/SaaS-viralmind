const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.RAPIDAPI_KEY;

async function checkEndpoint(pathName, method) {
  const instaHost = "instagram-scraper-stable-api.p.rapidapi.com";
  let url = `https://${instaHost}/${pathName}`;
  
  const options = {
    method: method,
    headers: { 
      'X-RapidAPI-Key': apiKey || "", 
      'X-RapidAPI-Host': instaHost
    }
  };

  if (method === 'POST') {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = new URLSearchParams({ username_or_url: 'leomessi' });
  } else {
    url += `?username_or_url=leomessi`;
  }

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let status = res.status;
    if (status === 200 && !text.includes("does not exist")) {
      console.log(`Endpoint ${method} /${pathName} -> SUCCESS! Status: ${status} | Response snippet: ${text.substring(0, 300)}\n`);
    } else {
      // console.log(`Endpoint ${method} /${pathName} -> Status: ${status}`);
    }
  } catch (e) {
    // console.log(`Endpoint ${method} /${pathName} failed:`, e.message);
  }
}

async function start() {
  const endpoints = [
    "get_user_details.php",
    "get_user_profile.php",
    "get_profile.php",
    "get_ig_profile.php",
    "get_user_details",
    "get_user_profile",
    "get_user_about.php",
    "get_ig_user_about.php",
    "get_media_data.php",
    "get_media_data",
    "get_user_posts.php",
    "get_user_posts",
    "get_user_info_flow.php",
    "get_user_info_flow"
  ];
  
  console.log("Starting probe of Instagram endpoints...");
  for (const ep of endpoints) {
    await checkEndpoint(ep, 'GET');
    await checkEndpoint(ep, 'POST');
  }
  console.log("Probe finished.");
}

start();
