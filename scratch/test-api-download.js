async function testApi() {
  const url = "https://www.youtube.com/shorts/N8Szc3UGrl4";
  console.log("Calling POST /api/download-video with URL:", url);
  try {
    const res = await fetch("http://localhost:3000/api/download-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error calling API:", err.message);
  }
}

testApi();
