import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId: clientUserId, email: clientEmail, provider, country, phoneNumber } = body;

    if (!plan) {
      return NextResponse.json({ error: "Veuillez sélectionner un plan d'abonnement." }, { status: 400 });
    }

    const normalizedPlan = plan.toLowerCase();
    const validPlans = ["monthly", "quarterly", "yearly", "pass_month", "pass_quarter", "pass_year"];

    if (!validPlans.includes(normalizedPlan)) {
      return NextResponse.json({ error: "Plan invalide sélectionné." }, { status: 400 });
    }

    // Mapping des plans vers le format standard
    let targetPlan: "monthly" | "quarterly" | "yearly" = "monthly";
    if (normalizedPlan === "quarterly" || normalizedPlan === "pass_quarter") {
      targetPlan = "quarterly";
    } else if (normalizedPlan === "yearly" || normalizedPlan === "pass_year") {
      targetPlan = "yearly";
    }

    // Détermination de l'utilisateur (Firebase ou Supabase)
    let userId = clientUserId;
    let userEmail = clientEmail || "";

    if (!userId) {
      try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email || "";
        }
      } catch (e) {
        console.warn("Supabase auth check notice:", e);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non authentifié. Veuillez vous connecter." }, { status: 401 });
    }

    // Récupération des tarifs dynamiques synchronisés depuis Firestore
    let dynamicMonthly = 4900;
    let dynamicQuarterly = 12900;
    let dynamicYearly = 39900;

    try {
      const pricingSnap = await getDoc(doc(db, "settings", "pricing"));
      if (pricingSnap.exists()) {
        const pData = pricingSnap.data();
        if (pData.monthlyPrice) dynamicMonthly = Number(pData.monthlyPrice);
        if (pData.quarterlyPrice) dynamicQuarterly = Number(pData.quarterlyPrice);
        if (pData.yearlyPrice) dynamicYearly = Number(pData.yearlyPrice);
      }
    } catch (e) {
      console.warn("Firestore pricing fetch fallback notice:", e);
    }

    // Calcul du tarif exact en Franc CFA (XOF)
    const planConfig = {
      monthly: {
        name: "Plan Mensuel",
        price: dynamicMonthly,
        period: "1 mois",
      },
      quarterly: {
        name: "Plan Trimestriel",
        price: dynamicQuarterly,
        period: "3 mois",
      },
      yearly: {
        name: "Plan Annuel",
        price: dynamicYearly,
        period: "1 an",
      },
    };

    const currentConfig = planConfig[targetPlan];
    const price = currentConfig.price;

    const paytechApiKey = process.env.PAYTECH_API_KEY;
    const paytechApiSecret = process.env.PAYTECH_API_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Configuration de l'environnement PayTech ('test' ou 'prod')
    const rawEnv = (process.env.PAYTECH_ENV || "").toLowerCase();
    const paytechEnv = (rawEnv === "live" || rawEnv === "prod" || rawEnv === "production") ? "prod" : "test";

    // Payload standard de paiement PayTech (ouvre la passerelle complète avec tous les moyens Mobile Money)
    const payload: Record<string, any> = {
      item_name: `ViralMind - ${currentConfig.name} (${currentConfig.period})`,
      item_price: String(price),
      currency: "XOF",
      ref_command: `VM-${targetPlan.toUpperCase()}-${Date.now()}-${userId.slice(0, 6)}`,
      command_name: `Abonnement ViralMind ${currentConfig.name}`,
      env: paytechEnv,
      custom_field: JSON.stringify({ 
        userId, 
        plan: targetPlan, 
        email: userEmail,
        phone: phoneNumber || "",
        country: country || "",
        provider: provider || "",
        price,
      }),
      success_url: `${appUrl}/settings?tab=Abonnement&payment=success&plan=${targetPlan}`,
      cancel_url: `${appUrl}/settings?tab=Abonnement&payment=cancel`,
      ipn_url: `${appUrl}/api/user/paytech/ipn`,
    };

    console.log("Initialisation paiement PayTech standard:", payload);

    const res = await fetch("https://paytech.sn/api/payment/request-payment", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API_KEY": paytechApiKey || "",
        "API_SECRET": paytechApiSecret || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success !== 1) {
      console.error("PayTech API Error:", data);
      return NextResponse.json({ 
        error: data.error?.[0] || data.message || "Erreur d'initialisation du paiement PayTech." 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      redirectUrl: data.redirect_url,
      token: data.token,
      refCommand: payload.ref_command,
    });
  } catch (error: any) {
    console.error("PayTech Checkout Route Error:", error);
    return NextResponse.json({ error: error.message || "Erreur interne de paiement." }, { status: 500 });
  }
}
