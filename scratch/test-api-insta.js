async function testInsta() {
  const url = "https://www.instagram.com/reel/DYASoMYsqfc/";
  console.log("Calling POST /api/download-video for Instagram Reel...");
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
    console.error("Error:", err.message);
  }
}

testInsta();
