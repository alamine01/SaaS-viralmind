import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserQuotas } from "@/lib/quota-service";
import { getDbClient } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let dbClient;
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const supabase = await createSupabaseServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    // Check if current user is an admin
    const quotas = await getUserQuotas(supabase, currentUser.id);
    if (quotas.role !== "admin") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const body = await request.json();
    const { plan, role, monthly_analysis_count, daily_script_count, daily_upload_count } = body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (plan !== undefined) {
      const planLower = plan.toLowerCase();
      if (!["free", "pro", "visionary", "titan"].includes(planLower)) {
        return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
      }
      fieldsToUpdate.push(`plan = $${paramIndex++}`);
      values.push(planLower);
    }

    if (role !== undefined) {
      const roleLower = role.toLowerCase();
      if (!["user", "admin"].includes(roleLower)) {
        return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
      }
      fieldsToUpdate.push(`role = $${paramIndex++}`);
      values.push(roleLower);
    }

    if (monthly_analysis_count !== undefined) {
      const val = parseInt(monthly_analysis_count, 10);
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: "Quota mensuel d'analyses invalide" }, { status: 400 });
      }
      fieldsToUpdate.push(`monthly_analysis_count = $${paramIndex++}`);
      values.push(val);
    }

    if (daily_script_count !== undefined) {
      const val = parseInt(daily_script_count, 10);
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: "Quota quotidien de scripts invalide" }, { status: 400 });
      }
      fieldsToUpdate.push(`daily_script_count = $${paramIndex++}`);
      values.push(val);
    }

    if (daily_upload_count !== undefined) {
      const val = parseInt(daily_upload_count, 10);
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: "Quota quotidien d'uploads invalide" }, { status: 400 });
      }
      fieldsToUpdate.push(`daily_upload_count = $${paramIndex++}`);
      values.push(val);
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    // Connect to database and update profile
    dbClient = getDbClient();
    await dbClient.connect();

    values.push(id);
    const query = `
      UPDATE profiles 
      SET ${fieldsToUpdate.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const res = await dbClient.query(query, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: res.rows[0] });
  } catch (error: any) {
    console.error("Admin Users PATCH API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (dbClient) {
      await dbClient.end().catch((err: any) => console.error("Error closing pg client:", err));
    }
  }
}
