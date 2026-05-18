const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("=== DÉBUT DU TEST DE SCAN DU RADAR ===");
  
  const testEmail = `test_radar_${Math.floor(Math.random() * 10000)}@viralmind.ai`;
  const testPassword = "SuperSecurePassword123!";

  console.log(`1. Inscription d'un utilisateur de test : ${testEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error("Erreur d'inscription Auth :", authError.message);
    return;
  }

  const user = authData.user;
  if (!user) {
    console.error("Utilisateur non renvoyé par Supabase");
    return;
  }
  console.log(`Utilisateur créé dans Supabase Auth (ID: ${user.id})`);

  console.log("2. Vérification / Insertion du profil utilisateur...");
  const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  
  if (!profileCheck) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: testEmail,
      plan: 'free'
    });
    if (profileError) {
      console.error("Erreur lors de l'insertion manuelle du profil :", profileError.message);
      return;
    }
    console.log("Profil inséré avec succès !");
  } else {
    console.log("Le profil existait déjà.");
  }

  const testHandle = "BenjaminCode";
  console.log(`3. Ajout de @${testHandle} (YouTube) sous surveillance...`);
  
  const { data: monitoredAccount, error: monitorError } = await supabase
    .from('monitored_accounts')
    .insert({
      user_id: user.id,
      handle: testHandle,
      platform: 'youtube',
      last_scanned_at: null
    })
    .select()
    .single();

  if (monitorError) {
    console.error("Erreur d'insertion du compte surveillé :", monitorError.message);
    return;
  }
  console.log(`Compte surveillé enregistré ! ID: ${monitoredAccount.id}`);

  console.log("\n4. Déclenchement de l'API de Scan (http://localhost:3000/api/monitor/scan)...");
  try {
    const response = await fetch("http://localhost:3000/api/monitor/scan");
    const text = await response.text();
    
    if (response.status !== 200 || text.startsWith("<!DOCTYPE")) {
      console.error(`\n❌ ERREUR SERVEUR (${response.status}) :`);
      console.error("Le serveur a renvoyé du HTML au lieu de JSON. Voici un extrait du code d'erreur :");
      console.error(text.substring(0, 1500));
      return;
    }

    const scanResult = JSON.parse(text);
    console.log("RÉPONSE DE L'API DE SCAN :");
    console.log(JSON.stringify(scanResult, null, 2));

    console.log("\n5. Vérification des pépites (outliers) enregistrées en base de données...");
    const { data: outliers, error: outlierError } = await supabase
      .from('detected_outliers')
      .select('*')
      .eq('account_id', monitoredAccount.id);

    if (outlierError) {
      console.error("Erreur de récupération des outliers :", outlierError.message);
    } else {
      console.log(`\n==========================================`);
      console.log(`🎉 TEST RÉUSSI AVEC SUCCÈS !`);
      console.log(`Compte analysé : @${testHandle}`);
      console.log(`Nombre de pépites détectées en BDD : ${outliers.length}`);
      console.log(`==========================================`);
      
      outliers.forEach((out, index) => {
        console.log(`Outlier #${index + 1} :`);
        console.log(` - URL : ${out.video_url}`);
        console.log(` - Vues : ${parseInt(out.views).toLocaleString()}`);
        console.log(` - Score Outlier : x${out.outlier_score} fois la médiane`);
        console.log(` ----------------------------------------`);
      });
    }

  } catch (err) {
    console.error("\n❌ ERREUR DE CONNEXION AU SERVEUR :", err.message);
  }
}

runTest();
