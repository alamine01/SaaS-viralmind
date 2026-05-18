const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testValidation(handle, platform) {
  console.log(`\nTesting validation for @${handle} on ${platform}...`);
  
  // We can call our local route handler code directly!
  // To do that, let's mock the request and run the POST method from route.ts
  const { POST } = require('../app/api/monitor/validate/route.ts');
  
  const req = {
    json: async () => ({ handle, platform })
  };
  
  try {
    const res = await POST(req);
    const data = await res.json();
    console.log("Result:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error running route handler directly:", e.message);
  }
}

async function run() {
  // Let's register ts-node dynamically to run route.ts
  require('ts-node').register({
    compilerOptions: {
      module: "commonjs",
      target: "es2022"
    }
  });
  
  await testValidation("khabyyyyyyyyyyyyu", "tiktok");
  await testValidation("khaby.lame", "tiktok");
  await testValidation("khabyyyyyyyyyyyyu", "instagram");
  await testValidation("tiboinshape", "instagram");
}

run();
