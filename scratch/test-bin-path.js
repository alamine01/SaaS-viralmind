const fs = require("fs");
const path = require("path");
const binPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", "yt-dlp.exe");
console.log("Binary path:", binPath);
console.log("Exists:", fs.existsSync(binPath));
