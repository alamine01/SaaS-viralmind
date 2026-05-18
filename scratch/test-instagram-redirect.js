async function checkInstagramRedirect() {
  const url = "https://www.instagram.com/khabyyyyyyyyyyyyu/";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    console.log("Response URL:", response.url);
    console.log("Redirected:", response.redirected);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkInstagramRedirect();
