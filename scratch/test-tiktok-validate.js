async function checkTiktok() {
  const url = "https://www.tiktok.com/@khabyyyyyyyyyyyyu";
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    const html = await response.text();
    console.log("HTML length:", html.length);
    console.log("Includes 'ce compte est introuvable'?:", html.toLowerCase().includes("ce compte est introuvable") || html.toLowerCase().includes("compte est introuvable") || html.toLowerCase().includes("notfound"));
    console.log("HTML snippet:", html.substring(0, 1000));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

checkTiktok();
