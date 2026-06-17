const instances = [
  "https://nuko-c.meowing.de",
  "https://cobalt.alpha.wolfy.love",
  "https://cobalt.omega.wolfy.love",
  "https://grapefruit.clxxped.lol",
  "https://apicobalt.mgytr.top"
];

async function runTest() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rickroll
  
  for (const instance of instances) {
    console.log(`\nTesting instance: ${instance} ...`);
    try {
      const res = await fetch(instance, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({ url })
      });
      console.log(`Status for ${instance}:`, res.status);
      const text = await res.text();
      console.log(`Raw response:`, text);
      if (res.ok) {
        const data = JSON.parse(text);
        if (data.url) {
          console.log(`SUCCESS! URL found: ${data.url}`);
          break;
        }
      }
    } catch (err) {
      console.error(`Error with ${instance}:`, err.message);
    }
  }
}

runTest();
