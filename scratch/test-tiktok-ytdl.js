const youtubedl = require("youtube-dl-exec");

async function runTest() {
  const url = "https://www.tiktok.com/@alamine.inspire/video/7583357524397575446";
  console.log("Fetching TikTok video using youtube-dl-exec...");
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
    console.error("youtube-dl-exec failed for TikTok:", err.message);
  }
}

runTest();
