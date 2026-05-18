async function checkD1(username) {
  const url = `https://www.instagram.com/${username}/?__a=1&__d=1`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    
    console.log(`@${username} -> Status:`, response.status);
    console.log(`@${username} -> Status Text:`, response.statusText);
  } catch (e) {
    console.log(`@${username} -> Error:`, e.message);
  }
}

async function run() {
  await checkD1("tiboinshape");
  await checkD1("khabyyyyyyyyyyyyu");
}

run();
