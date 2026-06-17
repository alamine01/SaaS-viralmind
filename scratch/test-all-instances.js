const apis = [
  "https://nuko-c.meowing.de",
  "https://cobalt.alpha.wolfy.love",
  "https://cobalt.omega.wolfy.love",
  "https://grapefruit.clxxped.lol",
  "https://apicobalt.mgytr.top",
  "https://cobaltapi.squair.xyz",
  "https://api.cobalt.blackcat.sweeux.org",
  "https://cobaltapi.kittycat.boo",
  "https://dog.kittycat.boo",
  "https://lime.clxxped.lol",
  "https://melon.clxxped.lol",
  "https://fox.kittycat.boo",
  "https://api.qwkuns.me"
];

async function run() {
  const url = "https://www.instagram.com/reel/DYASoMYsqfc/";
  const successList = [];
  
  for (const api of apis) {
    console.log(`\nTesting: ${api} ...`);
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
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      if (res.ok) {
        const data = JSON.parse(text);
        if (data.url) {
          console.log(`🎉 SUCCESS WITH: ${api}`);
          successList.push(api);
        }
      } else {
        console.log(`Response: ${text.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`Failed for ${api}: ${e.message}`);
    }
  }
  
  console.log("\nSummary of working instances:");
  console.log(successList);
}

run();
