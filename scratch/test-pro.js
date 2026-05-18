const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAAJVorH9YXU0puweEF5mfHQE9xHb5wfwI");

async function testPro() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Test.");
    console.log("RÉPONSE PRO :", result.response.text());
  } catch (error) {
    console.error("ÉCHEC PRO :", error.message);
  }
}

testPro();
