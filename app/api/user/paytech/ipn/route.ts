import { NextResponse } from "next/server";

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

      // Mettre à jour le forfait du créateur dans Firebase Firestore
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");

      await updateDoc(doc(db, "users", userId), {
        plan: plan.toLowerCase(),
        isAnnual: !!isAnnual,
        updatedAt: serverTimestamp(),
        lastPaymentDate: new Date().toISOString()
      });

      console.log(`[PayTech success] Utilisateur ${userId} promu au plan ${plan.toUpperCase()} dans Firebase Firestore (${isAnnual ? "Annuel" : "Mensuel"}) !`);
    }

    // Répondre systématiquement HTTP 200 OK à PayTech pour accuser réception de la notification
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayTech IPN Webhook Route Main Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
