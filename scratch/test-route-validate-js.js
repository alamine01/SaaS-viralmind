async function testLocalValidation(handle, platform) {
  const url = "http://localhost:3002/api/monitor/validate";
  console.log(`\nQuerying local API server for @${handle} on ${platform}...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, platform })
    });
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error querying local API:", e.message);
  }
}

async function run() {
  await testLocalValidation("khabyyyyyyyyyyyyu", "tiktok");
  await testLocalValidation("khaby.lame", "tiktok");
  await testLocalValidation("khabyyyyyyyyyyyyu", "instagram");
  await testLocalValidation("tiboinshape", "instagram");
}

run();
