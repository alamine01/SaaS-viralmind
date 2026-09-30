import { NextResponse } from "next/server";
import { db as firestoreDb } from "../../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export interface AdminPaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: "monthly" | "quarterly" | "yearly" | "other";
  planLabel: string;
  amount: number;
  currency: string;
  refCommand: string;
  itemName: string;
  gateway: string;
  paymentMethod: string;
  status: "completed" | "pending" | "failed" | "refunded";
  createdAt: string;
  rawDate: string;
}

export async function GET() {
  try {
    // 1. Récupération des utilisateurs pour joindre les infos clients
    const usersSnap = await getDocs(collection(firestoreDb, "users"));
    const usersMap = new Map<string, any>();
    
    usersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      usersMap.set(docSnap.id, {
        id: docSnap.id,
        email: data.email || "Non renseigné",
        displayName: data.displayName || data.full_name || (data.email ? data.email.split("@")[0] : "Créateur"),
        phoneNumber: data.phoneNumber || data.phone || data.lastPaymentPhone || null,
        plan: (data.plan || "free").toLowerCase(),
        lastPaymentDate: data.lastPaymentDate || null,
        lastPaymentRef: data.lastPaymentRef || null,
        lastPaymentAmount: data.lastPaymentAmount || null,
        lastPaymentMethod: data.lastPaymentMethod || null,
      });
    });

    // 2. Récupération de tous les paiements enregistrés dans Firestore
    const paymentsSnap = await getDocs(collection(firestoreDb, "payments"));
    const transactions: AdminPaymentTransaction[] = [];
    const seenRefs = new Set<string>();

    paymentsSnap.docs.forEach((docSnap) => {
      const d = docSnap.data();
      const user = usersMap.get(d.userId) || {};

      let rawDateStr = new Date().toISOString();
      if (d.createdAt && typeof d.createdAt.toDate === "function") {
        rawDateStr = d.createdAt.toDate().toISOString();
      } else if (d.createdAt?.seconds) {
        rawDateStr = new Date(d.createdAt.seconds * 1000).toISOString();
      } else if (d.created_at) {
        rawDateStr = new Date(d.created_at).toISOString();
      } else if (d.createdAt && typeof d.createdAt === "string") {
        rawDateStr = new Date(d.createdAt).toISOString();
      }

      const planRaw = (d.plan || "monthly").toLowerCase();
      let normalizedPlan: "monthly" | "quarterly" | "yearly" | "other" = "monthly";
      let planLabel = "Mensuel (4 900 FCFA)";

      if (planRaw.includes("year") || planRaw.includes("annuel")) {
        normalizedPlan = "yearly";
        planLabel = "Annuel (39 900 FCFA)";
      } else if (planRaw.includes("quarter") || planRaw.includes("trimestriel")) {
        normalizedPlan = "quarterly";
        planLabel = "Trimestriel (12 900 FCFA)";
      } else if (planRaw.includes("month") || planRaw.includes("mensuel") || planRaw.includes("pro")) {
        normalizedPlan = "monthly";
        planLabel = "Mensuel (4 900 FCFA)";
      } else {
        normalizedPlan = "other";
        planLabel = d.itemName || "Abonnement Pro";
      }

      const ref = d.refCommand || docSnap.id;
      seenRefs.add(ref);

      const resolvedMethod = d.paymentMethod || d.payment_method || user.lastPaymentMethod || "Wave / Orange Money";
      const resolvedPhone = d.customerPhone || d.phoneNumber || d.phone || user.phoneNumber || undefined;

      transactions.push({
        id: docSnap.id,
        userId: d.userId || "inconnu",
        userName: user.displayName || d.customerName || "Créateur Mobile",
        userEmail: user.email || d.userEmail || d.customerEmail || "Email non spécifié",
        userPhone: resolvedPhone,
        plan: normalizedPlan,
        planLabel,
        amount: Number(d.amount) || (normalizedPlan === "yearly" ? 39900 : normalizedPlan === "quarterly" ? 12900 : 4900),
        currency: d.currency || "XOF",
        refCommand: ref,
        itemName: d.itemName || `Abonnement ViralMind ${planLabel}`,
        gateway: d.gateway || "PayTech",
        paymentMethod: resolvedMethod,
        status: (d.status || "completed") as any,
        createdAt: new Date(rawDateStr).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        rawDate: rawDateStr,
      });
    });

    // 3. Fallback : si des utilisateurs ont souscrit mais la table payments n'avait pas encore tous les anciens records
    usersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const plan = (data.plan || "free").toLowerCase();
      const isPaidPlan = ["monthly", "mensuel", "quarterly", "trimestriel", "yearly", "annuel", "pro"].includes(plan);

      if (isPaidPlan) {
        const ref = data.lastPaymentRef || `VM-USR-${docSnap.id.substring(0, 8)}`;
        if (!seenRefs.has(ref)) {
          seenRefs.add(ref);

          let normalizedPlan: "monthly" | "quarterly" | "yearly" | "other" = "monthly";
          let planLabel = "Mensuel (4 900 FCFA)";
          let defaultAmount = 4900;

          if (plan.includes("year") || plan.includes("annuel")) {
            normalizedPlan = "yearly";
            planLabel = "Annuel (39 900 FCFA)";
            defaultAmount = 39900;
          } else if (plan.includes("quarter") || plan.includes("trimestriel")) {
            normalizedPlan = "quarterly";
            planLabel = "Trimestriel (12 900 FCFA)";
            defaultAmount = 12900;
          }

          const rawDateStr = data.lastPaymentDate || data.createdAt || new Date().toISOString();

          transactions.push({
            id: `sub_${docSnap.id}`,
            userId: docSnap.id,
            userName: data.displayName || data.full_name || (data.email ? data.email.split("@")[0] : "Créateur"),
            userEmail: data.email || "Non renseigné",
            userPhone: data.phoneNumber || data.lastPaymentPhone || null,
            plan: normalizedPlan,
            planLabel,
            amount: Number(data.lastPaymentAmount) || defaultAmount,
            currency: "XOF",
            refCommand: ref,
            itemName: `Abonnement Actif ${planLabel}`,
            gateway: "PayTech",
            paymentMethod: data.lastPaymentMethod || "Wave / Orange Money",
            status: "completed",
            createdAt: new Date(rawDateStr).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: rawDateStr,
          });
        }
      }
    });

    // Tri par date la plus récente
    transactions.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    // Calcul des statistiques globales
    const totalRevenue = transactions
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayRevenue = transactions
      .filter((t) => t.status === "completed" && t.rawDate.startsWith(todayStr))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const thisMonthRevenue = transactions
      .filter((t) => {
        if (t.status !== "completed") return false;
        const d = new Date(t.rawDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyCount = transactions.filter((t) => t.plan === "monthly").length;
    const quarterlyCount = transactions.filter((t) => t.plan === "quarterly").length;
    const yearlyCount = transactions.filter((t) => t.plan === "yearly").length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        todayRevenue,
        thisMonthRevenue,
        totalTransactions: transactions.length,
        completedTransactions: transactions.filter((t) => t.status === "completed").length,
        planDistribution: {
          monthly: monthlyCount,
          quarterly: quarterlyCount,
          yearly: yearlyCount,
        },
      },
      transactions,
    });
  } catch (error: any) {
    console.error("Admin Payments API Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des transactions" },
      { status: 500 }
    );
  }
}
