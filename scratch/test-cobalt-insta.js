const api = "https://api.cobalt.blackcat.sweeux.org";
const url = "https://www.instagram.com/reel/DYASoMYsqfc/";

async function runTest() {
  console.log(`Testing Instagram download on: ${api}...`);
  try {
    const res = await fetch(api, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({ url })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

runTest();
