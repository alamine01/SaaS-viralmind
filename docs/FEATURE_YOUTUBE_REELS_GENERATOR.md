# 🎥 Spécifications Techniques : Découpage Vidéo YouTube vers Reels / Shorts avec Sous-titres AI

> **Statut :** Planifié pour version future  
> **Projet :** ViralMind  
> **Date de création :** 10 Août 2026  

---

## 📌 1. Objectif de la Fonctionnalité

Permettre à un utilisateur de coller l'URL d'une vidéo YouTube longue (ex: 20 min - 1h+) pour :
1. Extrait automatiquement les **moments les plus viraux / captivants**.
2. Découper la vidéo en **plusieurs clips au format vertical 9:16** (Shorts, Reels, TikTok).
3. Générer et incruster des **sous-titres dynamiques et animés** mot-à-mot.
4. Proposer des titres, descriptions et hashtags optimisés pour les réseaux sociaux.

---

## 🔄 2. Architecture Globale du Workflow

```mermaid
flowchart TD
    A[Lien YouTube] --> B[1. Extraction Audio & Téléchargement]
    B --> C[2. Transcription Horodatée (Whisper / Groq)]
    C --> D[3. Détection des Clips Viraux (LLM - Gemini 1.5 / GPT-4o)]
    D --> E[4. Recadrage 9:16 & Sous-Titres Animés (Creatomate / FFmpeg / Remotion)]
    E --> F[5. Sauvegarde & Téléchargement dans ViralMind Dashboard]
```

---

## 🛠️ 3. Catalogue des APIs et Technologies Évaluées

### A. Transcription et Horodatage (*Word-level Timestamps*)
| API / Outil | Description | Avantages | Coût Est. |
| :--- | :--- | :--- | :--- |
| **Groq API (`whisper-large-v3`)** *(Recommandé)* | Transcription ultra-rapide basée sur Whisper. | 10x plus rapide qu'OpenAI, très haute précision. | ~0,04$ / heure audio |
| **OpenAI Whisper API** | API officielle OpenAI `v1/audio/transcriptions`. | Robuste et facile d'accès. | 0,36$ / heure audio |
| **AssemblyAI** | Transcription + détection automatique d'Auto-Chapters. | Détecte déjà les sujets clés nativement. | ~0,37$ / heure audio |
| **Deepgram** | API de speech-to-text très rapide. | Supporte la diarization (détection des intervenants). | ~0,25$ / heure audio |

### B. Analyse et Sélection des Moments Viraux
| Modèle / API | Usage | Pourquoi ce choix ? |
| :--- | :--- | :--- |
| **Google Gemini 1.5 Pro / Flash** *(Recommandé)* | Analyse de contenu & multimodalité. | Fenêtre de contexte de +1M tokens. Peut traiter des heures d'audio/vidéo en direct et extraire les timestamps exacts avec leurs hooks. |
| **OpenAI GPT-4o / GPT-4o-mini** | Analyse JSON à partir du fichier SRT/VTT. | Formatage JSON strict (`response_format: json_object`) très fiable pour extraire `start_time` et `end_time`. |

### C. Édition & Rendu Vidéo 9:16 avec Sous-titres
| Solution | Mode de fonctionnement | Avantages / Inconvénients |
| :--- | :--- | :--- |
| **Creatomate API** *(Cloud Recommandé)* | API REST Cloud d'édition vidéo. | **Avantages :** Rendu 9:16 cloud sans serveur lourd, sous-titres animés mot-à-mot nativement.<br>**Inconvénient :** Payant à la minute vidéo. |
| **Shotstack API** | Engine de rendu "FFmpeg in the cloud". | **Avantages :** Très flexible pour les montages multi-flux.<br>**Inconvénient :** Modèle de prix au crédit. |
| **Remotion (AWS Lambda)** | Code React rendu en MP4 sur AWS Lambda. | **Avantages :** Personnalisation totale en React/Tailwind des animations de sous-titres et habillage.<br>**Inconvénient :** Demande un setup AWS. |
| **FFmpeg + Microservice Python (FastAPI)** | Hébergé sur VPS GPU/CPU (ex: Hetzner / Railway). | **Avantages :** Coût fixe ultra économique à grande échelle.<br>**Inconvénient :** Maintenance serveur et gestion de la file d'attente (*queues* BullMQ / Celery). |

---

## 💰 4. Comparatif des Stratégies d'Implémentation

```
Option 1 : 100% Cloud (Rapide à sortir / Low Code)
└─ yt-dlp → Gemini 1.5 Flash → Creatomate API
   • Temps d'intégration : ~2 à 3 jours
   • Coût estimé : ~0,10$ à 0,30$ par clip généré

Option 2 : Hybride React Serverless (Scalable & Stylisé)
└─ yt-dlp → Groq Whisper → Gemini/GPT-4o → Remotion Lambda
   • Temps d'intégration : ~1 à 2 semaines
   • Coût estimé : ~0,02$ à 0,05$ par clip généré

Option 3 : Microservice Dédié (Coût optimisé pour gros volumes)
└─ FastAPI Python (yt-dlp + Whisper + FFmpeg + MediaPipe face tracking)
   • Temps d'intégration : ~2 à 3 semaines
   • Coût estimé : Fixe selon le VPS (ex: 20-40$/mois)
```

---

## 📋 5. Plan d'Action d'Intégration dans ViralMind

- [ ] **Étape 1 : Base de Données (Supabase)**
  - Créer la table `youtube_clips_jobs` (`id`, `user_id`, `youtube_url`, `status`, `clips_json`, `created_at`).
- [ ] **Étape 2 : Route d'API Backend (`app/api/video/cut-reels/route.ts`)**
  - Validation du lien YouTube et lancement de la tâche asynchrone.
- [ ] **Étape 3 : Service d'Analyse IA**
  - Envoi de la transcription à Gemini/GPT-4o pour obtenir la liste des clips sous format JSON :
    ```json
    [
      {
        "title": "La clé de la réussite",
        "start_time": 125.4,
        "end_time": 165.2,
        "hook": "Vous ne devinerez jamais cette règle...",
        "viral_score": 92
      }
    ]
    ```
- [ ] **Étape 4 : Rendu & Stockage Storage**
  - Rendu du MP4 9:16 + stockage dans le Bucket Supabase Storage / Cloudflare R2.
- [ ] **Étape 5 : Interface Utilisateur (Dashboard)**
  - Page `app/(dashboard)/reels-generator/page.tsx` avec barre d'URL, barre de progression et lecteur vidéo avec sous-titres modifiables.

---

*Ce document est sauvegardé dans le projet ViralMind pour référence lors des développements futurs.*
