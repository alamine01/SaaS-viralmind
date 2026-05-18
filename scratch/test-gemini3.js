const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAAJVorH9YXU0puweEF5mfHQE9xHb5wfwI");

async function testGemini3() {
  try {
    // On teste le nom exact vu sur votre capture d'écran
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent("Bonjour !");
    console.log("RÉPONSE GEMINI 3 :", result.response.text());
    console.log("--- ÇA MARCHE ENFIN ! ---");
  } catch (error) {
    console.error("ÉCHEC GEMINI 3 :", error.message);
  }
}

testGemini3();
