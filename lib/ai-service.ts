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
    2. RÉPONDS EXCLUSIVEMENT EN FRANÇAIS (sauf pour le champ "original_transcript" qui doit être dans la langue d'origine parlée dans la vidéo).
    3. REGARDE les textes incrustés si une vidéo est fournie.
    4. NE RIEN INVENTER. Si tu n'as ni vidéo ni transcription, réponds {"error": "Aucune donnée reçue"}.
    
    Donne-moi une analyse complète au format JSON :
    0. "visual_description": Une phrase décrivant précisément ce que tu vois à l'image (en français).
    1. "hook": Le hook utilisé (les mots exacts PARLÉS EN FRANÇAIS).
    2. "whyItWorks": Pourquoi la vidéo marche (en français).
    3. "structure": La structure détaillée (Hook, Développement, Conclusion) (en français).
    4. "emotion": L'émotion principale (en français).
    5. "patterns": Les patterns viraux détectés (en français).
    6. "viral_score": Score 0-100.
    7. "full_transcript": Transcription intégrale mot à mot EN FRANÇAIS de tout ce qui est dit dans la vidéo. RÈGLES CRUCIALES pour cette transcription : utilise des points de suspension "..." pour marquer les pauses, les hésitations et les silences du créateur. Reste fidèle au rythme parlé et au ton oral de la vidéo (ne réécris pas, ne reformule pas, ne littérarise pas). Traduis naturellement en français parlé courant mais GARDE la structure exacte de ce qui est dit, phrase par phrase, pause par pause.
    8. "original_transcript": Transcription textuelle mot à mot intégrale dans la LANGUE ORIGINALE parlée dans la vidéo (par exemple, la transcription exacte en anglais de ses paroles si le créateur parle anglais, sans traduction ni modification). Utilise aussi "..." pour marquer les pauses et hésitations.
    
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
    Agis en tant qu'expert en viralité mondiale, copywriter d'élite et raconteur d'histoires hors pair.
    Ton objectif est de concevoir un script vidéo qui CAPTURE l'attention immédiatement et qui sonne comme un véritable humain de chair et d'os.

    CONCEPT : "${concept}"
    NICHE : ${niche}
    ${toneInstruction}
    ${durationText}

    ========================================================================
    🔴 DIRECTIVES D'HUMANISATION ABSOLUE (ZÉRO STYLE IA CONVENTIONNEL) :
    ========================================================================
    - SONORITÉ NATURELLE & PARLÉE : Rédige le texte dans un français parlé, authentique, vivant et captivant. Interdiction d'utiliser des transitions robotiques d'IA comme "En outre", "Dans cette vidéo nous allons voir", "Voici pourquoi", "C'est pourquoi", "De plus", "En conclusion", "Imaginez ceci". Utilise plutôt des transitions naturelles et directes ("Tu vois,", "En fait,", "Le truc c'est...", "Franchement,", "Mais attends, le pire c'est...").
    - HISTOIRES, VULNÉRABILITÉ & CONCRET : Introduis du vécu, de la crédibilité concrète ("J'ai testé...", "Je me suis rendu compte de...", "Il m'est arrivé un truc de fou..."), des chiffres précis et étranges (ex: "17,4%" plutôt que "90%"), et des analogies physiques plutôt que des concepts purement théoriques.
    - FILTRE ANTI-CLICHÉS D'IA : Interdit d'utiliser les expressions usées d'IA ("dans ce monde moderne", "l'ultime secret", "révolutionner", "il est crucial de", "le guide ultime", "découvrez comment", "imaginez un monde").
    
    ========================================================================
    🌀 ARCHITECTURE DYNAMIQUE ET DIVERSIFIÉE DES SCRIPTS :
    ========================================================================
    Choisis DYNAMIQUEMENT l'une des architectures suivantes selon ce qui colle le mieux à ton concept pour garantir une création unique :
    
    Voici les architectures possibles :
    
    1. Architecture Narrative (In Medias Res) :
       - [ANECDOTE_CHOC] : Commence direct au milieu de l'action ou d'une confession.
       - [FLASHBACK] : Comment on en est arrivé là (le problème initial).
       - [REVELATION] : La leçon apprise ou la découverte clé.
       - [VALEUR_PRATIQUE] : Explications concrètes applicables.
       - [CTA_FLUIDE] : Un appel à l'action glissé naturellement sans forcer.
       
    2. Architecture Contrarienne (Unpopular Opinion) :
       - [MYTHE_COMMUN] : Attaque directe d'une croyance ou d'un conseil populaire.
       - [PREUVE_CONTRAIRE] : Ton argument ou preuve solide qui détruit le mythe.
       - [CONCORDANCE_REEL] : Pourquoi les gens tombent dans le panneau.
       - [STRATEGIE] : Comment faire différemment et mieux.
       - [CTA] : Demande l'avis de l'audience ou invite à l'action.
       
    3. Architecture Coulisses (Build in Public) :
       - [ECHEC_SANS_FILTRE] : Confession d'une erreur ou d'une frustration.
       - [LEÇON_CACHE] : Ce que cet échec t'a secrètement appris.
       - [DEMONSTRATION] : Preuve en direct ou guide rapide.
       - [APPEL_ACTION] : Incitation à rejoindre l'aventure.
       
    4. Architecture Socratique (The Paradox Loop) :
       - [QUESTION_DERANGEANTE] : Pose une question contre-intuitive.
       - [PIEGE_VISIBLE] : La fausse bonne idée que tout le monde suit.
       - [SOLUTION_INATTENDUE] : L'angle de résolution secret.
       - [CTA_INVISIBLE] : Appel à l'action intégré de façon transparente.
       
    Ajuste librement les types ("type") de tes blocs dans le tableau "script" pour refléter fidèlement l'architecture choisie (ex: "ANECDOTE", "CONFESSION", "MYTHE", "CONTRE-COURANT", "PREUVE", "LEÇON", "REVELATION", "DEMONSTRATION", "CTA", etc.).
    
    ========================================================================
    ⚡ CRÉATON 100% UNIQUE & ZÉRO PLAGIAT (RÈGLES D'OR STRICTES) :
    ========================================================================
    - INTERDICTION ABSOLUE DE PLAGIAT : Si le concept ou le contexte fait référence à une vidéo analysée ou existante (remix/outlier), tu as l'INTERDICTION STRICTE de faire du copier-coller de phrases entières ou de traduire littéralement le texte d'origine. Ne réutilise pas les mêmes mots, expressions ou structures de phrases.
    - RÉÉCRITURE CRÉATIVE COMPLÈTE : Tu dois extraire uniquement l'intention psychologique (la structure narrative, la leçon de fond, l'accroche structurelle), mais réinventer à 100% le texte de A à Z avec un style original, d'autres métaphores, un vocabulaire différent et un angle neuf. Le résultat ne doit présenter aucun plagiat textuel ou ressemblance verbale avec l'original.
    - PERSONNALISATION EXTRÊME : Évite les idées de premier niveau pour qu'aucun script généré ne ressemble à un autre sur le même domaine.

    Donne-moi le résultat au format JSON suivant :
    {
      "score": 92,
      "explanation": "Une phrase courte expliquant pourquoi ce script va percer dans la niche ${niche} avec son architecture unique.",
      "script": [
        {"type": "LE_NOM_DE_L_ETAPE_DANS_L_ARCHITECTURE", "time": "0:03", "audio": "Le texte exact parlé en français avec intonation humaine", "visual": "Description précise de l'image/mouvement/rythme visuel"}
        // Ajoute autant de blocs que nécessaire pour couvrir la durée requise de façon rythmée
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
    Tu es un expert d'élite en viralité de vidéos courtes/longues (TikTok, Reels, Shorts, YouTube) et rédacteur publicitaire de génie.
    Ton rôle est de guider l'utilisateur pour concevoir, affiner ou corriger un script vidéo hautement addictif, ultra-naturel et viral.

    CONTRÔLES DU SCRIPT ACTUELS :
    - Niche / Domaine : "${niche || "Général"}"
    - Ton visé : "${tone || "Viral"}"
    - Durée cible : "${durationText}"
    - Style de la marque : ${toneInstruction}

    ========================================================================
    🔴 DIRECTIVES D'HUMANISATION ABSOLUE (ZÉRO STYLE IA CONVENTIONNEL) :
    ========================================================================
    - SONORITÉ NATURELLE & PARLÉE : Rédige le texte dans un français parlé, authentique, vivant et captivant. Interdiction d'utiliser des transitions robotiques d'IA comme "En outre", "Dans cette vidéo nous allons voir", "Voici pourquoi", "C'est pourquoi", "De plus", "En conclusion", "Imaginez ceci". Utilise plutôt des transitions naturelles et directes ("Tu vois,", "En fait,", "Le truc c'est...", "Franchement,", "Mais attends, le pire c'est...").
    - HISTOIRES, VULNÉRABILITÉ & CONCRET : Introduis du vécu, de la crédibilité concrète ("J'ai testé...", "Je me suis rendu compte de...", "Il m'est arrivé un truc de fou..."), des chiffres précis et étranges (ex: "17,4%" plutôt que "90%"), et des analogies physiques plutôt que des concepts purement théoriques.
    - FILTRE ANTI-CLICHÉS D'IA : Interdit d'utiliser les expressions usées d'IA ("dans ce monde moderne", "l'ultime secret", "révolutionner", "il est crucial de", "le guide ultime", "découvrez comment", "imaginez un monde").
    
    ========================================================================
    🌀 ARCHITECTURE DYNAMIQUE ET DIVERSIFIÉE DES SCRIPTS :
    ========================================================================
    Choisis DYNAMIQUEMENT l'une des architectures suivantes selon ce qui colle le mieux à ton concept pour garantir une création unique :
    
    Voici les architectures possibles :
    
    1. Architecture Narrative (In Medias Res) :
       - [ANECDOTE_CHOC] : Commence direct au milieu de l'action ou d'une confession.
       - [FLASHBACK] : Comment on en est arrivé là (le problème initial).
       - [REVELATION] : La leçon apprise ou la découverte clé.
       - [VALEUR_PRATIQUE] : Explications concrètes applicables.
       - [CTA_FLUIDE] : Un appel à l'action glissé naturellement sans forcer.
       
    2. Architecture Contrarienne (Unpopular Opinion) :
       - [MYTHE_COMMUN] : Attaque directe d'une croyance ou d'un conseil populaire.
       - [PREUVE_CONTRAIRE] : Ton argument ou preuve solide qui détruit le mythe.
       - [CONCORDANCE_REEL] : Pourquoi les gens tombent dans le panneau.
       - [STRATEGIE] : Comment faire différemment et mieux.
       - [CTA] : Demande l'avis de l'audience ou invite à l'action.
       
    3. Architecture Coulisses (Build in Public) :
       - [ECHEC_SANS_FILTRE] : Confession d'une erreur ou d'une frustration.
       - [LEÇON_CACHE] : Ce que cet échec t'a secrètement appris.
       - [DEMONSTRATION] : Preuve en direct ou guide rapide.
       - [APPEL_ACTION] : Incitation à rejoindre l'aventure.
       
    4. Architecture Socratique (The Paradox Loop) :
       - [QUESTION_DERANGEANTE] : Pose une question contre-intuitive.
       - [PIEGE_VISIBLE] : La fausse bonne idée que tout le monde suit.
       - [SOLUTION_INATTENDUE] : L'angle de résolution secret.
       - [CTA_INVISIBLE] : Appel à l'action intégré de façon transparente.

    Ajuste librement les types ("type") de tes blocs dans le tableau "script" pour refléter fidèlement l'architecture choisie (ex: "ANECDOTE", "CONFESSION", "MYTHE", "CONTRE-COURANT", "PREUVE", "LEÇON", "REVELATION", "DEMONSTRATION", "CTA", etc.).
    
    ========================================================================
    ⚡ CRÉATON 100% UNIQUE & ZÉRO PLAGIAT (RÈGLES D'OR STRICTES) :
    ========================================================================
    - INTERDICTION ABSOLUE DE PLAGIAT : Si l'utilisateur fait référence à une vidéo analysée, existante, à une transcription ou à un remix dans l'historique ou dans sa demande, tu as l'INTERDICTION STRICTE de faire du copier-coller de phrases entières ou de traduire littéralement le texte d'origine. Ne réutilise pas les mêmes mots, expressions ou structures de phrases.
    - RÉÉCRITURE CRÉATIVE COMPLÈTE : Tu dois extraire uniquement l'intention psychologique (la structure narrative, la leçon de fond, l'accroche structurelle), mais réinventer à 100% le texte de A à Z avec un style original, d'autres métaphores, un vocabulaire différent et un angle neuf. Le résultat ne doit présenter aucun plagiat textuel ou ressemblance verbale avec l'original.
    - PERSONNALISATION EXTRÊME : Évite les idées de premier niveau pour qu'aucun script généré ne ressemble à un autre sur le même domaine.

    RÈGLES DE CONVERSATION :
    1. Si l'utilisateur dit simplement bonjour, te salue ou si son idée/concept n'est pas encore claire : **sois accueillant et pose-lui 1 ou 2 questions simples** en français pour comprendre son objectif, son idée de vidéo, ou ce qu'il vend/présente. Ne génère pas de script immédiatement.
    2. Si le concept de l'utilisateur est clair, s'il a répondu à tes questions ou si il te demande explicitement un script : **RÉDIGE LE SCRIPT** au format JSON structuré ci-dessous.
    3. Si un script a déjà été généré précédemment (inclus dans l'historique ci-dessous) et que l'utilisateur te demande des changements (ex: "raccourcis-le", "change l'accroche", "rends-le plus dynamique", "modifie le visuel 3") : **GÉNÈRE À NOUVEAU LE SCRIPT ENTIER EN APPLIQUANT LES MODIFICATIONS**, toujours au format JSON strict ci-dessous.
    4. Réponds toujours en français.

    DIRECTIVES DU HOOK (Accroche) :
    - Ne commence JAMAIS par "Arrête de scroller" ou des variantes similaires.
    - Utilise des angles psychologiques forts (curiosité extrême, question directe, contre-courant, résultat immédiat, négatif/peur).

    ---
    FORMAT DE RÉPONSE JSON OBLIGATOIRE (Uniquement si tu rédiges ou modifies un script) :
    {
      "score": 92,
      "explanation": "Une phrase courte expliquant pourquoi ce script va cartonner dans la niche ${niche} avec son architecture unique.",
      "script": [
        {"type": "LE_NOM_DE_L_ETAPE_DANS_L_ARCHITECTURE", "time": "0:03", "audio": "Texte exact parlé en français avec intonation humaine", "visual": "Description précise de l'image, des gestes et du rythme visuel"}
        // Ajoute autant de blocs que nécessaire pour couvrir la durée requise de façon rythmée
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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return text.trim();
};
