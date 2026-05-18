
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyAAJVorH9YXU0puweEF5mfHQE9xHb5wfwI");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${genAI.apiKey}`);
    const data = await response.json();
    console.log("Modèles disponibles :");
    data.models.forEach(m => console.log("- " + m.name));
  } catch (e) {
    console.error("Erreur lors de la liste des modèles", e);
  }
}

listModels();
