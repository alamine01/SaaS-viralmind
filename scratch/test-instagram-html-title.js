async function getTitle(username) {
  const url = `https://www.instagram.com/${username}/`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
    });
    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "No Title Found";
    console.log(`@${username} -> Title:`, title);
  } catch (e) {
    console.log(`@${username} -> Error:`, e.message);
  }
}

async function run() {
  await getTitle("tiboinshape");
  await getTitle("khabyyyyyyyyyyyyu");
}

run();
