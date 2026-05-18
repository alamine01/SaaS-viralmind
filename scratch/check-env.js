require('dotenv').config({ path: '.env.local' });
console.log("--- TEST ENV ---");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "PRÉSENTE (commence par " + process.env.GEMINI_API_KEY.substring(0,4) + ")" : "ABSENTE");
console.log("RAPIDAPI_KEY:", process.env.RAPIDAPI_KEY ? "PRÉSENTE" : "ABSENTE");
console.log("----------------");
