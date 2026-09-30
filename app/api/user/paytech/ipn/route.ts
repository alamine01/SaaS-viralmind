import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
        const text = await req.text();
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    console.log("PayTech IPN Webhook Reçu:", body);

    const { type_event, ref_command, item_price, item_name, custom_field } = body;

    // PayTech notifie avec 'sale_complete' ou 'paid'
    const isPaymentSuccess = type_event === "sale_complete" || type_event === "paid" || body.status === "success";

    if (isPaymentSuccess) {
      let metadata: any = {};
      if (custom_field) {
        try {
          metadata = typeof custom_field === "string" ? JSON.parse(custom_field) : custom_field;
        } catch (e) {
          console.warn("Erreur parsing custom_field:", e);
        }
      }

      const userId = metadata.userId || body.client_id;
      let plan = (metadata.plan || "monthly").toLowerCase();

      // Normalisation du plan
      if (plan.includes("year") || plan.includes("annuel")) {
        plan = "yearly";
      } else if (plan.includes("quarter") || plan.includes("trimestriel")) {
        plan = "quarterly";
      } else {
        plan = "monthly";
      }

      const paymentMethod = body.payment_method || body.type_event || metadata.paymentMethod || "Wave / Orange Money";
      const customerPhone = body.client_phone || body.phone_number || body.phone || metadata.phoneNumber || null;
      const customerEmail = body.client_email || body.email || metadata.userEmail || null;
      const customerName = body.client_name || metadata.userName || null;

      if (userId) {
        const quotaConfig = {
          monthly: { analyses: 50, scripts: 20 },
          quarterly: { analyses: 150, scripts: 50 },
          yearly: { analyses: 500, scripts: 100 },
        };

        const quotas = quotaConfig[plan as keyof typeof quotaConfig] || quotaConfig.monthly;

        // 1. Mettre à jour l'utilisateur dans Firestore
        await updateDoc(doc(db, "users", userId), {
          plan,
          subscriptionStatus: "active",
          subscriptionPlan: plan,
          monthly_analysis_count: quotas.analyses,
          daily_script_count: quotas.scripts,
          lastPaymentDate: new Date().toISOString(),
          lastPaymentRef: ref_command || `VM-PAY-${Date.now()}`,
          lastPaymentAmount: Number(item_price) || (plan === "yearly" ? 39900 : plan === "quarterly" ? 12900 : 4900),
          lastPaymentMethod: paymentMethod,
          lastPaymentPhone: customerPhone,
          updated_at: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });

        // 2. Enregistrer la transaction dans la collection 'payments' pour l'historique
        const paymentId = ref_command || `pay_${Date.now()}`;
        await setDoc(doc(db, "payments", paymentId), {
          userId,
          plan,
          amount: Number(item_price) || (plan === "yearly" ? 39900 : plan === "quarterly" ? 12900 : 4900),
          currency: "XOF",
          refCommand: ref_command || paymentId,
          itemName: item_name || `Abonnement ViralMind ${plan}`,
          status: "completed",
          gateway: "paytech",
          paymentMethod,
          customerPhone,
          customerEmail,
          customerName,
          createdAt: serverTimestamp(),
          created_at: new Date().toISOString(),
        }, { merge: true });

        console.log(`[PayTech Success] Utilisateur ${userId} mis à niveau avec succès au plan ${plan.toUpperCase()} !`);
      } else {
        console.warn("[PayTech Notice] Impossible d'extraire le userId du webhook PayTech:", body);
      }
    }

    // Toujours répondre HTTP 200 à PayTech
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayTech IPN Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
