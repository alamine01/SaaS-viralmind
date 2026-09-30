import { NextResponse } from "next/server";
import { db as firestoreDb } from "../../../../../lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { adminAuth } from "../../../../../lib/firebase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { plan, role, monthly_analysis_count } = body;

    const userDocRef = doc(firestoreDb, "users", id);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Utilisateur introuvable dans Firebase" }, { status: 404 });
    }

    const updatePayload: any = {};
    if (plan !== undefined) {
      updatePayload.plan = plan.toLowerCase();
    }
    if (role !== undefined) {
      updatePayload.role = role.toLowerCase();
    }
    if (monthly_analysis_count !== undefined) {
      updatePayload.dailyQuotas = parseInt(monthly_analysis_count, 10);
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
    console.error("Admin User PATCH 100% Firebase Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 1. Supprimer le document utilisateur de Firestore
    const userDocRef = doc(firestoreDb, "users", id);
    await deleteDoc(userDocRef);

    // 2. Tenter de supprimer le compte d'authentification Firebase Auth
    try {
      if (adminAuth) {
        await adminAuth.deleteUser(id);
      }
    } catch (authErr) {
      console.warn("Could not delete from Firebase Auth (might be non-existent or service account issue):", authErr);
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé définitivement de la base de données.",
    });
  } catch (error: any) {
    console.error("Admin User DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
