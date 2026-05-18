import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Agis en tant qu'expert mondial en viralité (TikTok, Reels, Shorts).
      Génère 3 HOOKS (accroches) ultra-viraux pour le sujet suivant : "${topic || "Général / Buzz / Curiosité"}".
      
      RÈGLES :
      1. Pas de "Arrête de scroller".
      2. Utilise la psychologie (curiosité, peur, bénéfice immédiat, contre-courant).
      3. Format court et percutant.
      
      Réponds UNIQUEMENT avec un JSON au format suivant :
      [
        {"text": "Texte du hook 1", "type": "Curiosité", "views": "1.2M"},
        {"text": "Texte du hook 2", "type": "Contre-courant", "views": "850k"},
        {"text": "Texte du hook 3", "type": "Bénéfice", "views": "2.1M"}
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return NextResponse.json(JSON.parse(jsonStr));

  } catch (error: any) {
    console.error("Hooks Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
