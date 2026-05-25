import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    // Support des formats JSON et form-urlencoded de PayTech
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      try {
        body = await req.json();
      } catch (e) {
        // En cas de corps brut ou vide
        const text = await req.text();
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    console.log("PayTech IPN Webhook Recieved Payload:", body);

    const { type_event, ref_command, custom_field } = body;

    // PayTech envoie 'sale_complete' ou 'paid' lors d'un paiement réussi
    if (type_event === "sale_complete" || type_event === "paid") {
      if (!custom_field) {
        console.error("PayTech Webhook Error: custom_field was missing from payload.");
        return NextResponse.json({ error: "custom_field metadata missing" }, { status: 400 });
      }

      // Décoder les métadonnées de la transaction (userId, plan, isAnnual)
      const metadata = JSON.parse(custom_field);
      const { userId, plan, isAnnual } = metadata;

      if (!userId || !plan) {
        console.error("PayTech Webhook Error: userId or plan was missing inside custom_field.");
        return NextResponse.json({ error: "Invalid metadata structure" }, { status: 400 });
      }

      // Instancier le client admin de Supabase pour bypasser les règles RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Mettre à jour le forfait du créateur et restaurer la totalité de ses quotas
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          plan: plan.toLowerCase(),
          monthly_analysis_count: 0,
          last_analysis_reset: new Date().toISOString(),
          daily_script_count: 0,
          last_script_reset: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) {
        console.error("Supabase Admin update error inside IPN callback:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`[PayTech success] Utilisateur ${userId} promu au plan ${plan.toUpperCase()} (${isAnnual ? "Annuel" : "Mensuel"}) !`);
    }

    // Répondre systématiquement HTTP 200 OK à PayTech pour accuser réception de la notification
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayTech IPN Webhook Route Main Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
