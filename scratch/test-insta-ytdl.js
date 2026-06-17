const youtubedl = require("youtube-dl-exec");

async function runTest() {
  const url = "https://www.instagram.com/reel/DYASoMYsqfc/";
  console.log("Fetching Instagram Reel using youtube-dl-exec...");
  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
    });
    console.log("SUCCESS!");
    console.log("Title:", output.title || output.description);
    console.log("URL:", output.url);
  } catch (err) {
    console.error("youtube-dl-exec failed for Instagram:", err.message);
  }
}

runTest();
