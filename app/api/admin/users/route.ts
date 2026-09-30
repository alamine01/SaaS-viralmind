import { NextResponse } from "next/server";
import { db as firestoreDb } from "../../../../lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface UnifiedUserProfile {
  id: string;
  email: string;
  plan: string;
  full_name: string;
  role: string;
  monthly_analysis_count: number;
  daily_script_count: number;
  daily_upload_count: number;
  created_at: string;
  source: "mobile" | "web";
  phoneNumber?: string | null;
  pushToken?: string | null;
}

export async function GET() {
  try {
    const snap = await getDocs(collection(firestoreDb, "users"));
    const normalizePlan = (p: string) => {
      const plan = (p || "free").toLowerCase();
      if (["mensuel", "monthly", "pro"].includes(plan)) return "monthly";
      if (["trimestriel", "quarterly"].includes(plan)) return "quarterly";
      if (["annuel", "yearly"].includes(plan)) return "yearly";
      return "free";
    };

    const users: UnifiedUserProfile[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      const rawDate = d.createdAt ? new Date(d.createdAt) : new Date();
      const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;

      return {
        id: docSnap.id,
        email: d.email || "Non renseigné",
        plan: normalizePlan(d.plan),
        full_name: d.displayName || d.phoneNumber || (d.email ? d.email.split("@")[0] : "Créateur"),
        role: d.role || "user",
        monthly_analysis_count: d.dailyQuotas ?? 3,
        daily_script_count: 0,
        daily_upload_count: 0,
        created_at: validDate.toISOString(),
        source: "mobile" as const,
        phoneNumber: d.phoneNumber || null,
        pushToken: d.pushToken ? "Actif" : "Inactif",
      };
    });

    // Tri par date d'inscription la plus récente en premier
    users.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime() || 0;
      const timeB = new Date(b.created_at).getTime() || 0;
      return timeB - timeA;
    });

    const monthlyCount = users.filter((u) => u.plan === "monthly").length;
    const quarterlyCount = users.filter((u) => u.plan === "quarterly").length;
    const yearlyCount = users.filter((u) => u.plan === "yearly").length;
    const freeCount = users.filter((u) => u.plan === "free").length;

    const stats = {
      total: users.length,
      mobileTotal: users.length,
      webTotal: 0,
      plans: {
        free: freeCount,
        monthly: monthlyCount,
        quarterly: quarterlyCount,
        yearly: yearlyCount,
        subscribers: monthlyCount + quarterlyCount + yearlyCount,
      },
      roles: {
        admin: users.filter((u) => u.role === "admin").length,
        user: users.filter((u) => u.role !== "admin").length,
      },
    };

    return NextResponse.json({ stats, users });
  } catch (error: any) {
    console.error("Admin Users GET 100% Firebase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || body.userId;

    if (!id) {
      return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
    }

    const { plan, role, monthly_analysis_count } = body;
    const userDocRef = doc(firestoreDb, "users", id);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Utilisateur introuvable dans Firebase" }, { status: 404 });
    }

    const updatePayload: any = {
      updatedAt: serverTimestamp(),
      updated_at: new Date().toISOString(),
    };

    if (plan !== undefined) {
      const normalizedPlan = plan.toLowerCase();
      updatePayload.plan = normalizedPlan;
      updatePayload.subscriptionPlan = normalizedPlan;
      updatePayload.subscriptionStatus = normalizedPlan === "free" ? "inactive" : "active";
    }

    if (role !== undefined) {
      updatePayload.role = role.toLowerCase();
    }

    if (monthly_analysis_count !== undefined) {
      const parsedQuotas = parseInt(monthly_analysis_count, 10);
      updatePayload.dailyQuotas = isNaN(parsedQuotas) ? 3 : parsedQuotas;
      updatePayload.monthly_analysis_count = updatePayload.dailyQuotas;
    }

    await updateDoc(userDocRef, updatePayload);

    return NextResponse.json({
      success: true,
      profile: {
        id,
        ...docSnap.data(),
        ...updatePayload,
      },
    });
  } catch (error: any) {
    console.error("Admin Users PATCH Error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur lors de la mise à jour" }, { status: 500 });
  }
}
