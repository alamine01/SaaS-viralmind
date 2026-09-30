# 📱 ViralMind Mobile — Feuille de Route & Plan de Gestion de Projet

> **Concept :** Application mobile "TikTok-First" (React Native + Expo + Firebase) permettant aux créateurs de contenu d'analyser n'importe quelle vidéo TikTok en 1 clic (via le menu Partager), de générer un script réécrit par l'IA et de tourner directement la vidéo grâce à un prompteur intégré avec la caméra frontale, avec paiement par Mobile Money (Wave, Orange Money, MTN).

---

## 🛠️ Stack Technique Retenue

- **Frontend Mobile :** React Native avec **Expo** (TypeScript, Expo Router, Expo Camera, Expo Share Intent).
- **Backend & Base de Données :** **Firebase** (Firebase Auth, Cloud Firestore, Firebase Storage, Firebase Cloud Messaging FCM).
- **IA & Scraping :** Serveur **Next.js** existant (`/api/analyse`, Google Gemini 1.5/2.0 Flash, API Scraping TikTok).
- **Passerelle de Paiement :** **Paystack / CinetPay** (Support complet Mobile Money : Wave, Orange Money, MTN, Moov).

---

## 🗄️ Architecture & Schéma Firestore (Base de Données)

```json
// Collection : users
users/{userId} = {
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string",
  "plan": "free" | "pro", // 'free' ou 'pro'
  "dailyQuotas": 3,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// Collection : analyses
analyses/{analysisId} = {
  "id": "string",
  "userId": "string",
  "videoUrl": "string",
  "platform": "tiktok",
  "title": "string",
  "thumbnail": "string",
  "hook": "string",
  "patterns": ["array", "of", "strings"],
  "structure": { "Hook": "...", "Développement": "...", "Conclusion": "..." },
  "summary": "string",
  "actionPlan": ["step1", "step2"],
  "transcript": "string",
  "createdAt": "timestamp"
}

// Collection : scripts
scripts/{scriptId} = {
  "id": "string",
  "userId": "string",
  "analysisId": "string",
  "title": "string",
  "hook": "string",
  "scriptText": "string",
  "targetDurationSeconds": 60,
  "createdAt": "timestamp"
}

// Collection : transactions
transactions/{transactionId} = {
  "id": "string",
  "userId": "string",
  "amount": 3000,
  "currency": "XOF",
  "paymentMethod": "wave" | "orange_money" | "mtn" | "card",
  "provider": "cinetpay" | "paystack",
  "status": "completed" | "pending" | "failed",
  "transactionRef": "string",
  "createdAt": "timestamp"
}
```

---

## 📅 Chronologie des Phases de Développement

### 📌 PHASE 1 : Cadrage & Configuration Firebase *(Durée : 1 - 2 Jours)*
- [ ] Créer le projet sur la Console Firebase.
- [ ] Activer **Firebase Authentication** (Email, Google, Téléphone SMS).
- [ ] Activer et configurer **Cloud Firestore** avec les règles de sécurité.
- [ ] Activer **Firebase Storage** pour les miniatures et avatars.
- [ ] Configurer `firebase-admin` dans le backend Next.js existant.

---

### 📱 PHASE 2 : Initialisation Expo & Authentification *(Durée : 2 - 3 Jours)*
- [ ] Initialiser le projet Expo (`npx create-expo-app viralmind-mobile -t tabs`).
- [ ] Installer et configurer les SDKs Firebase pour React Native.
- [ ] Créer l'écran d'Onboarding / Bienvenue.
- [ ] Créer les écrans d'Authentification (Connexion, Inscription Email & Google).
- [ ] Écran principal Tableau de bord (Historique des scripts récents et solde de quotas).

---

### ⚡ PHASE 3 : Partage TikTok ➔ Analyse Flash IA *(Durée : 3 - 4 Jours)*
- [ ] Configurer `expo-share-intent` pour intercepter le bouton *Partager vers ViralMind* dans l'application TikTok.
- [ ] Traiter la redirection du lien court (`vt.tiktok.com` / `vm.tiktok.com`).
- [ ] Envoyer l'URL à l'API de scraping + Gemini sur le serveur Next.js.
- [ ] Créer l'écran "Résultat de l'Analyse" (Hook, Déclencheurs cognitifs, Résumé).
- [ ] Sauvegarder l'analyse automatiquement dans Firestore sous le compte de l'utilisateur.

---

### 🎥 PHASE 4 : Script Réécrit & Prompteur Caméra *(Durée : 4 - 5 Jours)*
- [ ] Générateur de Script IA réécrit personnalisé selon le profil du créateur.
- [ ] Création du composant **Prompteur Intégré (Teleprompter)** :
  - Flux vidéo de la caméra frontale avec `expo-camera`.
  - Texte défilant en superposition (Overlay).
  - Réglage de la vitesse de défilement (WPM - mots par minute).
  - Réglage de la taille de la police et mode miroir.
  - Boutons Play / Pause / Enregistrer.
- [ ] Sauvegarde de la vidéo enregistrée dans la galerie photo du téléphone.

---

### 💳 PHASE 5 : Monétisation & Paiement Mobile Money *(Durée : 3 - 4 Jours)*
- [ ] Créer l'écran Paywall / Tarification (Pass Journée 500 FCFA, Pass Mensuel 3 000 FCFA).
- [ ] Intégrer le SDK / Checkout **CinetPay** ou **Paystack** (Wave, Orange Money, MTN, Moov).
- [ ] Traiter les webhooks de confirmation pour mettre à jour le statut `plan: 'pro'` de l'utilisateur dans Firestore.
- [ ] Blocage et gestion des limites pour les comptes gratuits.

---

### 🚀 PHASE 6 : Notifications, Tests & Publication *(Durée : 3 - 5 Jours)*
- [ ] Configurer **Firebase Cloud Messaging (FCM)** pour les notifications Push.
- [ ] Effectuer les tests E2E sur téléphones réels Android et iOS.
- [ ] Générer les builds natives avec **EAS Build** (`eas build -p android`, `eas build -p ios`).
- [ ] Déploiement et publication sur le **Google Play Store** et l'**Apple App Store**.

---

## 🎯 Prochaine Étape Immédiate

1. **Création du projet Firebase** et récupération du fichier de configuration (`google-services.json` pour Android / `GoogleService-Info.plist` pour iOS).
2. **Initialisation de l'application Expo Mobile** dans un dossier dédié ou monorepo.
