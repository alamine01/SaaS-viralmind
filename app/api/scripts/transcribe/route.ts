import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as Blob;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio reçu." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    // Utilisation de Gemini 1.5 Flash pour une transcription vocale rapide et ultra-précise
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType: file.type || "audio/webm"
        }
      },
      "Tu es un transcripteur professionnel. Transcris textuellement cet enregistrement audio de voix humaine en français. Rédige uniquement ce que tu entends mot à mot, sans ajouter d'introduction, de conclusion, d'explication ou de salutations. Si l'audio est vide ou incompréhensible, ne renvoie rien."
    ]);

    const transcription = result.response.text().trim();

    return NextResponse.json({ text: transcription });
  } catch (error: any) {
    console.error("Transcription API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
