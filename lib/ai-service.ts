import { GoogleGenerativeAI } from "@google/generative-ai";
// Hot reload trigger

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const analyzeVideo = async (videoUrl: string, title: string, transcript: string, audioUrl?: string) => {
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
    Tu es un expert en analyse de contenu viral et en stratégie marketing de contenu court.
    
    Analyse cette vidéo virale en te basant UNIQUEMENT sur les données réelles fournies ci-dessous.
    NE RIEN INVENTER. NE PAS DÉDUIRE. NE PAS EXTRAPOLER au-delà de ce qui est dit dans la transcription.
    
    Données de la vidéo :
    - URL : ${videoUrl}
    - Titre : "${title}"
    - Transcription réelle mot à mot : "${transcript}"
    ${audioUrl ? "- Un fichier vidéo a également été joint pour l'analyse visuelle." : ""}
    
    INSTRUCTIONS STRICTES :
    1. RÉPONDS EXCLUSIVEMENT EN FRANÇAIS (sauf pour le champ "original_transcript").
    2. BASE-TOI UNIQUEMENT sur la transcription fournie. Ne complète pas, n'invente pas.
    3. Si un fichier vidéo est joint, analyse les textes incrustés et le style visuel SANS inventer de dialogue.
    4. Tous les champs doivent être remplis avec des données extraites de la transcription réelle.
    
    Réponds au format JSON strict :
    {
      "visual_description": "Description du style visuel observé ou déduit du titre (1 phrase).",
      "hook": "L'accroche EXACTE telle qu'elle apparaît dans la transcription (premières secondes).",
      "whyItWorks": "Pourquoi cette vidéo fonctionne — basé sur la transcription (en français).",
      "structure": {
        "Hook": "...",
        "Développement": "...",
        "Conclusion": "..."
      },
      "summary": "Résumé stratégique de 3-4 phrases décrivant le message, le positionnement, le ton et l'audience cible.",
      "action_plan": [
        "Étape 1 : ...",
        "Étape 2 : ...",
        "Étape 3 : ..."
      ],
      "emotion": "L'émotion principale déclenchée chez le spectateur.",
      "patterns": ["pattern 1", "pattern 2", "pattern 3"],
      "viral_score": 0,
      "full_transcript": "Transcription intégrale mot à mot EN FRANÇAIS avec \"...\" pour les pauses.",
      "original_transcript": "Transcription mot à mot dans la langue originale avec \"...\" pour les pauses."
    }
    
    Réponds UNIQUEMENT avec le JSON brut valide, sans markdown.
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
    Tu es un Copywriter d'Élite international (niveau Top 1% mondial), spécialisé dans la création de vidéos hautement virales pour TikTok, Instagram Reels, YouTube Shorts et YouTube long format.
    Ton objectif est d'écrire un script vidéo d'une qualité EXCEPTIONNELLE, captivant de la première à la dernière seconde, avec une valeur ajoutée massive.
    
    CE QUE TU DOIS ÉVITER À TOUT PRIX (LE STYLE "CHATGPT GÉNÉRIQUE") :
    - ZÉRO répétition : Ne répète jamais deux fois la même idée ou le même concept sous des formes différentes. Chaque phrase doit apporter une nouvelle information ou faire progresser l'intrigue.
    - ZÉRO formule bateau/cliché d'IA : Interdit de commencer par des questions inutiles ("Avez-vous déjà... ?", "Vous voulez savoir comment... ?"). Interdit de finir par des résumés gnangnan ou convenus ("Et voilà !", "En conclusion...", "N'oubliez pas de vous abonner").
    - ZÉRO remplissage : Pas de phrases vides de sens ou trop corporatives ("Dans ce monde moderne...", "Il est crucial de...", "C'est essentiel pour..."). Chaque seconde de parole doit être utile et capter l'intérêt.
    
    CE QUE TU DOIS FAIRE (L'ÉCRITURE HAUT DE GAMME / VIRALE) :
    - ACCROCHE (HOOK) IMMÉDIATE ET CHOC : Ne commence JAMAIS par "Arrête de scroller" ou des variantes similaires. Commence directement par une affirmation forte, un fait surprenant, une confession sans filtre, ou une opinion impopulaire (ex: "J'ai testé tous les outils de productivité pendant 5 ans, et 99% sont des arnaques...").
    - DÉTAILS CONCRETS ET PREUVES : Remplace les concepts flous par des détails tangibles, des chiffres précis (ex: "14,3%" au lieu de "beaucoup"), des exemples réels ou des anecdotes concrètes.
    - STRUCTURE RYTHMÉE ET MICRO-TENSIONS : Divise le script en étapes claires et logiques. Chaque bloc doit se terminer par une micro-transition qui pousse le spectateur à écouter le bloc suivant (suspense ou curiosité).
    - TON D'UN VÉRITABLE CRÉATEUR HUMAIN : Rédige dans un français parlé naturel, percutant, fluide et vivant. Utilise des expressions parlées authentiques ("Le truc c'est que...", "En clair,", "Franchement,", "Le pire ?"), des phrases courtes et des ruptures de rythme (silences, accélérations).
    
    INFORMATIONS CONTEXTUELLES :
    - CONCEPT / IDÉE CLÉ : "${concept}"
    - NICHE / DOMAINE : "${niche}"
    - ${toneInstruction}
    - ${durationText}
    
    ========================================================================
    🌀 ARCHITECTURES DE HAUT NIVEAU (Choisis-en une dynamiquement selon le concept) :
    ========================================================================
    1. L'Architecture Narrative (In Medias Res) : Commencer par une anecdote/confession choc -> Expliquer le problème -> Révéler la solution -> Démontrer la valeur pratique -> CTA naturel.
    2. L'Architecture Contrarienne (Opinion Impopulaire) : Casser un mythe populaire -> Prouver le contraire avec un angle logique fort -> Révéler la méthode alternative -> CTA engageant.
    3. L'Architecture Coulisses (Build in Public) : Montrer un échec ou un process réel -> Extraire la leçon cachée -> Donner le plan d'action immédiat -> CTA fluide.
    4. L'Architecture Socratique (Le Paradoxe) : Poser une contradiction apparente -> Expliquer le piège où tout le monde tombe -> Révéler le secret d'initié -> CTA fluide.
    
    Rends-moi le résultat au format JSON strict suivant :
    {
      "score": 94,
      "explanation": "Une phrase courte et percutante expliquant la force psychologique et l'originalité de ce script pour la niche ${niche}.",
      "script": [
        {
          "type": "LE_NOM_DE_L_ETAPE_DANS_L_ARCHITECTURE",
          "time": "0:05",
          "audio": "Le texte exact parlé en français naturel. Utilise des phrases courtes, des respirations (...) pour le rythme. Zéro bla-bla.",
          "visual": "Instruction de mise en scène ultra-précise, dynamique et moderne (ex: close-up sur les yeux, transition rapide par zoom, affichage d'un chiffre clé en surimpression)."
        }
        // Ajoute autant de blocs courts et rythmés que nécessaire pour couvrir la durée ciblée sans aucune répétition.
      ]
    }
    Réponds UNIQUEMENT avec le JSON brut.
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

export const analyzeCompetitorProfile = async (
  handle: string,
  platform: string,
  followers: number,
  medianViews: number,
  recentPosts: any[],
  outliers: any[]
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const postsListText = recentPosts.map((p, i) => 
    `- Post ${i+1}: "${p.title}" (${p.views} vues) ${outliers.some(o => o.id === p.id) ? "[OUTLIER]" : ""}`
  ).join("\n");

  const prompt = `
    Agis en tant qu'expert en stratégie de contenu sur les réseaux sociaux, consultant d'élite et analyste de croissance.
    Ton rôle est de faire un audit complet de la stratégie de contenu du concurrent suivant :
    - Pseudo : @${handle}
    - Plateforme : ${platform}
    - Abonnés : ${followers}
    - Vues médianes (habituelles) : ${medianViews}

    Voici les titres et statistiques de ses posts récents :
    ${postsListText}

    Voici ses vidéos Outliers détectées (qui ont percé organiquement au-delà de ses statistiques habituelles) :
    ${outliers.map(o => `- "${o.title}" (${o.views} vues, score d'outlier de x${o.outlierScore || (o.views / medianViews).toFixed(1)})`).join("\n")}

    Fais une analyse approfondie et synthétique en français. Remplis les champs JSON suivants :
    1. "strategy_summary" : Un résumé accrocheur (3-4 phrases) du positionnement de ce concurrent et de sa niche de contenu.
    2. "hook_patterns" : Une liste de 3-4 stratégies/patterns d'accroches (hooks) qu'il utilise le plus et qui captent l'attention.
    3. "retention_secrets" : Pourquoi ses vidéos outliers ont si bien fonctionné (les secrets de rétention et de structure).
    4. "action_plan" : Un plan d'action concret en 3 étapes pour que l'utilisateur puisse créer des vidéos similaires mais encore plus virales et le dépasser dans sa niche.

    Donne-moi UNIQUEMENT le résultat au format JSON propre et valide :
    {
      "strategy_summary": "...",
      "hook_patterns": [
        "...",
        "..."
      ],
      "retention_secrets": "...",
      "action_plan": [
        "...",
        "..."
      ]
    }
    Réponds EXCLUSIVEMENT avec le JSON, sans aucun texte ou markdown autour.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini competitor audit response", text);
    throw new Error("L'IA a renvoyé un format d'audit invalide.");
  }
};

export const generateChatResponse = async (
  messages: any[],
  niche: string,
  tone: string,
  duration: string,
  toneProfile?: string
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const durationText = duration ? `La vidéo doit durer environ ${duration} secondes.` : "";
  const toneInstruction = toneProfile 
    ? `IMPORTANT : Respecte ABSOLUMENT le profil de style suivant pour l'écriture : "${toneProfile}". Utilise son vocabulaire, son énergie et ses tics de langage.`
    : `Utilise un ton : ${tone}`;

  const conversationHistory = messages.slice(0, -1).map(m => {
    let text = `${m.role.toUpperCase()}: ${m.content}`;
    if (m.script_data) {
      text += `\n[SCRIPT_GÉNÉRÉ_PRÉCÉDENT]: ${JSON.stringify(m.script_data)}`;
    }
    return text;
  }).join("\n\n");

  const prompt = `
    Tu es un Copywriter d'Élite international (niveau Top 1% mondial) et un consultant de croissance spécialisé dans les scripts ultra-viraux (TikTok, Reels, Shorts, YouTube).
    Ton rôle est de guider l'utilisateur, de lui donner des conseils marketing pointus, et de rédiger des scripts d'une qualité EXCEPTIONNELLE.
    
    CE QUE TU DOIS ÉVITER À TOUT PRIX (LE STYLE "CHATGPT GÉNÉRIQUE") :
    - ZÉRO répétition : Chaque phrase du script doit apporter de la valeur et faire avancer le sujet. Ne résume pas ce qui a déjà été dit, ne paraphrase pas.
    - ZÉRO formule bateau/cliché d'IA : Interdit de commencer par des questions inutiles ("Avez-vous déjà...", "Vous voulez savoir..."). Interdit de finir par des conclusions formatées ("N'attendez plus...", "Et voilà !").
    - ZÉRO remplissage : Pas de phrases corporatives creuses. Chaque mot doit sonner authentique, direct et humain.
    
    CE QUE TU DOIS FAIRE (L'ÉCRITURE HAUT DE GAMME) :
    - ACCROCHES ULTRA-PERCUTANTES : Ne commence JAMAIS par "Arrête de scroller" ou des variantes similaires. Crée une tension immédiate dès la première seconde (confession choc, fait insolite, cassage de mythe).
    - VALEUR PRATIQUE ET DÉTAILS CONCRETS : Utilise des chiffres précis (ex: "17,4%" plutôt que "la plupart"), des analogies visuelles fortes et des étapes claires.
    - MICRO-TENSIONS : Chaque étape du script doit donner envie de regarder la suivante.
    - TON ULTRA-HUMAIN : Rédige dans un français parlé naturel, énergique et direct (ex: "Le truc c'est...", "Franchement,", "En fait,", "Le pire ?").
    
    CONTRÔLES DU SCRIPT ACTUELS :
    - Niche / Domaine : "${niche || "Général"}"
    - Ton visé : "${tone || "Viral"}"
    - Durée cible : "${durationText}"
    - Style de la marque : ${toneInstruction}

    ========================================================================
    🌀 ARCHITECTURES DE HAUT NIVEAU (Applique l'une d'elles pour tout script généré) :
    ========================================================================
    1. L'Architecture Narrative (In Medias Res) : Commencer par une anecdote/confession choc -> Expliquer le problème -> Révéler la solution -> Démontrer la valeur pratique -> CTA naturel.
    2. L'Architecture Contrarienne (Opinion Impopulaire) : Casser un mythe populaire -> Prouver le contraire avec un angle logique fort -> Révéler la méthode alternative -> CTA engageant.
    3. L'Architecture Coulisses (Build in Public) : Montrer un échec ou un process réel -> Extraire la leçon cachée -> Donner le plan d'action immédiat -> CTA fluide.
    4. L'Architecture Socratique (Le Paradoxe) : Poser une contradiction apparente -> Expliquer le piège où tout le monde tombe -> Révéler le secret d'initié -> CTA fluide.

    RÈGLES DE CONVERSATION ET FORMATAGE :
    1. Si l'utilisateur salue ou si son idée/concept n'est pas encore claire : **sois accueillant et pose-lui 1 ou 2 questions pertinentes** pour cerner son objectif, son audience et son produit. Ne génère pas de script générique prématuré.
    2. Si le concept est clair, s'il a répondu à tes questions ou s'il te demande explicitement un script : **RÉDIGE LE SCRIPT** au format JSON structuré ci-dessous.
    3. Si un script a déjà été généré précédemment et que l'utilisateur te demande des modifications (ex: "raccourcis-le", "change l'accroche", "rends-le plus agressif") : **GÉNÈRE À NOUVEAU LE SCRIPT ENTIER EN APPLIQUANT LES MODIFICATIONS**, toujours au format JSON strict ci-dessous.
    4. Réponds toujours en français.

    FORMAT DE RÉPONSE JSON OBLIGATOIRE (Uniquement si tu rédiges ou modifies un script) :
    {
      "score": 94,
      "explanation": "Une phrase courte et percutante expliquant pourquoi ce script va cartonner dans la niche ${niche} avec son architecture unique.",
      "script": [
        {
          "type": "LE_NOM_DE_L_ETAPE_DANS_L_ARCHITECTURE",
          "time": "0:05",
          "audio": "Le texte exact parlé en français naturel. Utilise des phrases courtes, des respirations (...) pour le rythme. Zéro bla-bla.",
          "visual": "Instruction de mise en scène ultra-précise, dynamique et moderne (ex: close-up sur les yeux, transition rapide par zoom, affichage d'un chiffre clé en surimpression)."
        }
      ]
    }
    IMPORTANT : Si tu génères un script, réponds UNIQUEMENT avec le JSON brut. Pas de texte explicatif avant ou après.
    Si tu es dans une phase de discussion ou de guidage (sans générer de script), réponds par du texte français naturel, engageant et motivant (pas de format JSON).

    ---
    HISTORIQUE DE LA DISCUSSION :
    ${conversationHistory}

    Nouveau message de l'USER auquel tu dois répondre maintenant :
    USER: ${messages[messages.length - 1].content}
  `;

  const promptParts: any[] = [];

  const lastMessage = messages[messages.length - 1] || { content: "" };
  const lastMessageContent = lastMessage.content || "";

  // Regex to detect and parse attachments
  const attachmentRegex = /\[Pièce jointe \(([^)]+)\): "([^"]+)" accessible à l'adresse: ([^\]]+)\]/;
  const match = lastMessageContent.match(attachmentRegex);

  if (match) {
    const attachmentType = match[1];
    const attachmentName = match[2];
    const attachmentUrl = match[3].trim();

    console.log(`AI Service: Detected attachment in last message - Type: ${attachmentType}, Name: ${attachmentName}`);

    try {
      if (attachmentType === "image") {
        if (attachmentUrl.startsWith("data:image/")) {
          const parts = attachmentUrl.split(";base64,");
          const mimeType = parts[0].split("data:").pop() || "image/jpeg";
          const base64Data = parts[1];
          promptParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
          console.log("AI Service: Successfully parsed base64 image data URL.");
        } else {
          const resp = await fetch(attachmentUrl);
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const mimeType = resp.headers.get("content-type") || "image/jpeg";
            promptParts.push({
              inlineData: {
                data: base64,
                mimeType: mimeType
              }
            });
            console.log("AI Service: Successfully fetched and converted remote image to base64.");
          }
        }
      } else if (attachmentType === "doc") {
        // If it's a PDF, we can pass it as application/pdf inlineData
        if (attachmentUrl.endsWith(".pdf") || attachmentUrl.includes("pdf")) {
          const resp = await fetch(attachmentUrl);
          if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            promptParts.push({
              inlineData: {
                data: base64,
                mimeType: "application/pdf"
              }
            });
            console.log("AI Service: Successfully fetched and parsed PDF document.");
          }
        } else {
          // Plain text document
          const resp = await fetch(attachmentUrl);
          if (resp.ok) {
            const docText = await resp.text();
            console.log("AI Service: Successfully read plain text document contents.");
            // Append doc text directly into the prompt to provide full context
            promptParts.push(`CONTENU DU DOCUMENT ATTACHÉ ("${attachmentName}") :\n\n${docText}\n\n`);
          }
        }
      }
    } catch (e: any) {
      console.error("AI Service: Failed to fetch/parse attachment for multimodal Gemini API:", e.message);
    }
  }

  promptParts.push(prompt);

  const result = await model.generateContent(promptParts);
  const response = await result.response;
  const text = response.text();

  return text.trim();
};
