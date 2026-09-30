import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: "Plan manquant" }, { status: 400 });
    }

    const validPlans = ["free", "pro", "visionary", "titan"];
    const targetPlan = plan.toLowerCase();

    if (!validPlans.includes(targetPlan)) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    // Mettre à jour le plan de l'utilisateur et réinitialiser ses quotas pour lui offrir un nouveau départ
    const { error } = await supabase
      .from("profiles")
      .update({
        plan: targetPlan,
        monthly_analysis_count: 0,
        last_analysis_reset: new Date().toISOString(),
        daily_script_count: 0,
        last_script_reset: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Votre plan a été mis à jour avec succès vers ${plan.toUpperCase()} !`,
      plan: targetPlan
    });
  } catch (error: any) {
    console.error("Update Plan API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
