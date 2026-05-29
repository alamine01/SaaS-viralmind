const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log("Testing upload API route...");
  
  // Create a dummy file
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const filePath = path.resolve(__dirname, 'test-image.png');
  fs.writeFileSync(filePath, 'dummy image content');

  const fileBuffer = fs.readFileSync(filePath);
  
  let body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="test-image.png"\r\n`),
    Buffer.from(`Content-Type: image/png\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  try {
    const res = await fetch('http://localhost:3005/api/scripts/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        // We might need a session cookie if auth is checked, but let's see if it throws 401 (JSON) or 500 (Internal Server Error)
      },
      body: body
    });

    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Response Body (Truncated):", text.slice(0, 1000));
  } catch (e) {
    console.error("Request failed:", e.message);
  } finally {
    // Cleanup
    try { fs.unlinkSync(filePath); } catch (e) {}
  }
}

testUpload();
