async function testAnalyse() {
  const url = "https://www.instagram.com/reel/DYASoMYsqfc/";
  console.log("Calling POST /api/analyse with Instagram Reel...");
  try {
    const res = await fetch("http://localhost:3000/api/analyse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, userId: "test-user-id" }) // we might need a real user ID or mock
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testAnalyse();
