import { NextResponse } from "next/server";
import { db as firestoreDb } from "../../../../../lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { adminAuth } from "../../../../../lib/firebase-admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const rawParams = await context.params;
    const id = rawParams?.id;

    if (!id) {
      return NextResponse.json({ error: "ID utilisateur manquant dans l'URL" }, { status: 400 });
    }

    const body = await request.json();
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
    console.error("Admin User PATCH Error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const rawParams = await context.params;
    const id = rawParams?.id;

    if (!id) {
      return NextResponse.json({ error: "ID utilisateur manquant dans l'URL" }, { status: 400 });
    }

    // 1. Supprimer le document utilisateur de Firestore
    const userDocRef = doc(firestoreDb, "users", id);
    await deleteDoc(userDocRef);

    // 2. Tenter de supprimer le compte d'authentification Firebase Auth si adminAuth est initialisé
    try {
      if (adminAuth) {
        await adminAuth.deleteUser(id);
      }
    } catch (authErr) {
      console.warn("Could not delete from Firebase Auth (non-blocking):", authErr);
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé définitivement de la base de données.",
    });
  } catch (error: any) {
    console.error("Admin User DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur lors de la suppression" }, { status: 500 });
  }
}
