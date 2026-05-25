import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { plan, isAnnual } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: "Plan manquant" }, { status: 400 });
    }

    const validPlans = ["pro", "visionary", "titan"];
    const targetPlan = plan.toLowerCase();

    if (!validPlans.includes(targetPlan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    // Calcul du prix exact en Franc CFA (code devise XOF)
    let price = 0;
    if (targetPlan === "pro") {
      price = isAnnual ? 46800 : 4900;
    } else if (targetPlan === "visionary") {
      price = isAnnual ? 94800 : 9900;
    } else if (targetPlan === "titan") {
      price = isAnnual ? 298800 : 29900;
    }

    const paytechApiKey = process.env.PAYTECH_API_KEY;
    const paytechApiSecret = process.env.PAYTECH_API_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paytechEnv = process.env.PAYTECH_ENV || "test";

    // Payload de paiement PayTech
    const payload = {
      item_name: `ViralMind - Forfait ${targetPlan.toUpperCase()} (${isAnnual ? "Annuel" : "Mensuel"})`,
      item_price: String(price),
      currency: "XOF",
      ref_command: `VM-SUB-${Date.now()}-${user.id.slice(0, 8)}`,
      command_name: `Abonnement ViralMind ${targetPlan.toUpperCase()}`,
      env: paytechEnv,
      custom_field: JSON.stringify({ userId: user.id, plan: targetPlan, isAnnual }),
      success_url: `${appUrl}/settings?tab=Abonnement&payment=success`,
      cancel_url: `${appUrl}/settings?tab=Abonnement&payment=cancel`,
      ipn_url: `${appUrl}/api/user/paytech/ipn`
    };

    const res = await fetch("https://paytech.sn/api/payment/request-payment", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API_KEY": paytechApiKey || "",
        "API_SECRET": paytechApiSecret || ""
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success !== 1) {
      console.error("PayTech API Error:", data);
      return NextResponse.json({ error: data.error?.[0] || data.message || "Erreur d'initialisation PayTech" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      redirectUrl: data.redirect_url
    });
  } catch (error: any) {
    console.error("PayTech Checkout Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
