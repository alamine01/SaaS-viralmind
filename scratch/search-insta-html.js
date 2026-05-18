const fs = require('fs');

async function searchHtml() {
  const username = "moustapha.pb";
  const url = `https://www.instagram.com/${username}/`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Find all occurrences of "followers"
    const regex = /[^]{0,100}followers[^]{0,100}/gi;
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null && count < 10) {
      console.log(`Match ${++count}:`, match[0].replace(/\s+/g, ' '));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

searchHtml();
