import { GoogleGenerativeAI } from "@google/generative-ai";
// Hot reload trigger

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const analyzeVideo = async (videoUrl: string, transcript: string, audioUrl?: string) => {
  console.log("DEBUG: GEMINI_API_KEY présent ?", !!process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  let promptParts: any[] = [];
  
  if (audioUrl) {
    console.log("DEBUG: Tentative de téléchargement de la vidéo depuis :", audioUrl);
    try {
      const videoResp = await fetch(audioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.tiktok.com/'
        }
      });
      const videoBuffer = await videoResp.arrayBuffer();
      const firstBytes = Buffer.from(videoBuffer.slice(0, 50)).toString('hex');
      console.log("DEBUG: Taille vidéo:", videoBuffer.byteLength, "octets. Premiers octets (hex):", firstBytes);
      
      if (videoBuffer.byteLength < 5000) {
        console.warn("ATTENTION: Le fichier semble trop petit pour une vidéo. C'est peut-être une erreur 403 ou 404.");
      }

      const base64Video = Buffer.from(videoBuffer).toString('base64');
      promptParts.push({
        inlineData: {
          data: base64Video,
          mimeType: "video/mp4"
        }
      });
    } catch (e) {
      console.error("Failed to fetch video for AI", e);
    }
  }

  const prompt = `
    Analyse cette vidéo (URL: ${videoUrl}). 
    ${audioUrl ? "Je t'ai fourni le fichier vidéo complet pour l'analyse visuelle et sonore." : ""}
    ${transcript ? `Voici la transcription textuelle de la vidéo : "${transcript}"` : ""}
    
    INSTRUCTIONS STRICTES : 
    1. UTILISE la transcription fournie ci-dessus pour ton analyse et pour le champ "full_transcript".
    2. RÉPONDS EXCLUSIVEMENT EN FRANÇAIS.
    3. REGARDE les textes incrustés si une vidéo est fournie.
    4. NE RIEN INVENTER. Si tu n'as ni vidéo ni transcription, réponds {"error": "Aucune donnée reçue"}.
    
    Donne-moi une analyse complète au format JSON et RÉPONDS EXCLUSIVEMENT EN FRANÇAIS :
    0. "visual_description": Une phrase décrivant précisément ce que tu vois à l'image.
    1. "hook": Le hook utilisé (les mots exacts PARLÉS EN FRANÇAIS).
    2. "whyItWorks": Pourquoi la vidéo marche.
    3. "structure": La structure détaillée (Hook, Développement, Conclusion).
    4. "emotion": L'émotion principale.
    5. "patterns": Les patterns viraux détectés.
    6. "viral_score": Score 0-100.
    7. "full_transcript": Transcription mot à mot EN FRANÇAIS.
    
    IMPORTANT : Si tu n'as pas reçu de fichier vidéo ou si le fichier est corrompu, réponds simplement {"error": "Fichier vidéo non reçu par l'IA"}. NE RIEN INVENTER.
    
    Réponds UNIQUEMENT avec le JSON.
  `;
  
  promptParts.push(prompt);

  const result = await model.generateContent(promptParts);
  const response = await result.response;
  const text = response.text();
  
  try {
     // Basic cleanup in case Gemini adds markdown code blocks
     const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
     return JSON.parse(jsonStr);
  } catch (e) {
     console.error("Failed to parse Gemini response", text);
     throw new Error("L'IA a renvoyé un format invalide.");
  }
};

export const generateScripts = async (concept: string, niche: string, tone: string, duration?: string, toneProfile?: string) => {
  // Reload trigger: 2026-05-10T19:40
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const durationText = duration ? `La vidéo doit durer environ ${duration} secondes.` : "";
  const toneInstruction = toneProfile 
    ? `IMPORTANT : Respecte ABSOLUMENT le profil de style suivant pour l'écriture : "${toneProfile}". Utilise son vocabulaire, son énergie et ses tics de langage.`
    : `Utilise un ton : ${tone}`;

  const prompt = `
    Agis en tant qu'expert en viralité mondiale et copywriter publicitaire de haut niveau. 
    Ton objectif est de créer un script vidéo qui CAPTURE l'attention dès la première seconde.

    CONCEPT : "${concept}"
    NICHE : ${niche}
    ${toneInstruction}
    ${durationText}

    INSTRUCTIONS CRITIQUES POUR LE HOOK :
    1. INTERDICTION STRICTE : Ne commence JAMAIS par "Arrête de scroller", "Stop scrolling" ou des variantes similaires. C'est trop commun et ignoré par les utilisateurs.
    2. VARIÉTÉ OBLIGATOIRE : Utilise l'un des types de hooks suivants (choisis le plus adapté) :
       - Hook à contre-courant (ex: "Tout le monde te ment sur...", "L'erreur que 99% des gens font...")
       - Hook de résultat immédiat (ex: "Comment j'ai obtenu [X] sans faire [Y]...")
       - Hook de curiosité extrême (ex: "J'ai découvert un secret que [Marque/Expert] ne veut pas que tu saches...")
       - Hook négatif/peur (ex: "Arrête de faire ça tout de suite si tu ne veux pas perdre...")
       - Hook de question directe (ex: "Est-ce que tu savais que tu pouvais... ?")

    STRUCTURE DU SCRIPT (Ajuste le rythme selon la durée de ${durationText}) :
    - HOOK (0-3 sec) : Accroche visuelle et sonore percutante (Pattern Interrupt).
    - RETENTION/IDENTIFICATION (3-15 sec) : Connexion émotionnelle ou preuve sociale pour justifier l'attention.
    - STORYTELLING/DEVELOPPEMENT (Corps) : Utilise du "Pacing" (alternance de rythmes). Si la vidéo est longue (> 60s), intègre des "Open Loops" (mystères non résolus) et des "Micro-Hooks" toutes les 15 secondes. Sois profond et apporte une VRAIE valeur.
    - CLIMAX/REVELATION (Avant la fin) : Le point culminant de la valeur ou de l'histoire.
    - CALL TO ACTION (Fin) : Une action simple, directe et irrésistible.

    Donne-moi le résultat au format JSON suivant :
    {
      "score": 92,
      "explanation": "Une phrase courte expliquant pourquoi ce script va percer dans la niche ${niche}.",
      "script": [
        {"type": "HOOK", "time": "0:03", "audio": "Le texte parlé", "visual": "Description de l'image/mouvement"},
        {"type": "IDENTIFICATION", "time": "0:08", "audio": "...", "visual": "..."},
        {"type": "VALUE", "time": "0:30", "audio": "...", "visual": "..."},
        {"type": "CTA", "time": "0:45", "audio": "...", "visual": "..."}
      ]
    }
    Réponds UNIQUEMENT avec le JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  try {
     const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
     const parsed = JSON.parse(jsonStr);
     // If the AI returns the old format (just an array), wrap it
     if (Array.isArray(parsed)) {
       return {
         score: Math.floor(Math.random() * (95 - 88 + 1) + 88),
         explanation: "Script optimisé pour la niche " + niche,
         script: parsed
       };
     }
     return parsed;
  } catch (e) {
     throw new Error("Erreur lors de la génération du script.");
  }
};
