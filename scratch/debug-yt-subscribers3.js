async function debugSubs3() {
  const handle = "BenjaminCode";
  const ytUrl = `https://www.youtube.com/@${handle}`;
  
  const res = await fetch(ytUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  const html = await res.text();

  console.log("\n--- SEARCHING FOR SUBSCRIBERS IN HTML ---");
  
  // Find all matches for abonnés in HTML
  let index = 0;
  let count = 0;
  while (true) {
    index = html.indexOf("abonnés", index);
    if (index === -1) break;
    count++;
    console.log(`\nMatch #${count} at index ${index}:`);
    console.log(html.substring(index - 50, index + 100));
    index += 7;
    if (count >= 15) break;
  }
}

debugSubs3();
