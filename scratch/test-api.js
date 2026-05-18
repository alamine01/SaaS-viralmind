const { GoogleGenerativeAI } = require("@google/generative-ai");

// On teste directement avec la clé pour éliminer tout doute sur .env.local
const genAI = new GoogleGenerativeAI("AIzaSyAAJVorH9YXU0puweEF5mfHQE9xHb5wfwI");

async function testSimple() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Dis bonjour en un mot.");
    console.log("RÉPONSE GOOGLE :", result.response.text());
    console.log("--- TEST RÉUSSI ! ---");
  } catch (error) {
    console.error("ÉCHEC DU TEST :");
    console.error("Message:", error.message);
    if (error.response) {
        console.error("Détails:", JSON.stringify(error.response, null, 2));
    }
  }
}

testSimple();
