async function checkYoutube() {
  const url = "https://www.youtube.com/@khabyyyyyyyyyyyyu";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkYoutube();
