import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserQuotas } from "@/lib/quota-service";
import { getDbClient } from "@/lib/db";

export async function GET() {
  let client;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    // Check if the requesting user is an admin
    const quotas = await getUserQuotas(supabase, user.id);
    if (quotas.role !== "admin") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    client = getDbClient();
    await client.connect();

    // Query to fetch all users and their profile details
    const result = await client.query(`
      SELECT 
        p.id, 
        COALESCE(p.email, u.email) as email, 
        p.plan, 
        p.full_name, 
        p.role, 
        p.monthly_analysis_count, 
        p.daily_script_count, 
        p.daily_upload_count,
        COALESCE(p.created_at, u.created_at) as created_at
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      ORDER BY COALESCE(p.created_at, u.created_at) DESC;
    `);

    interface UserProfile {
      id: string;
      email: string;
      plan: string;
      full_name: string;
      role: string;
      monthly_analysis_count: number;
      daily_script_count: number;
      daily_upload_count: number;
      created_at: string;
    }

    const users: UserProfile[] = result.rows.map((row: any) => ({
      id: row.id,
      email: row.email || "Non renseigné",
      plan: row.plan || "free",
      full_name: row.full_name || "Sans nom",
      role: row.role || "user",
      monthly_analysis_count: row.monthly_analysis_count ?? 0,
      daily_script_count: row.daily_script_count ?? 0,
      daily_upload_count: row.daily_upload_count ?? 0,
      created_at: row.created_at
    }));

    // Calculate stats
    const stats = {
      total: users.length,
      plans: {
        free: users.filter(u => u.plan.toLowerCase() === "free").length,
        pro: users.filter(u => u.plan.toLowerCase() === "pro").length,
        visionary: users.filter(u => u.plan.toLowerCase() === "visionary").length,
        titan: users.filter(u => u.plan.toLowerCase() === "titan").length,
      },
      roles: {
        admin: users.filter(u => u.role === "admin").length,
        user: users.filter(u => u.role !== "admin").length,
      }
    };

    return NextResponse.json({ stats, users });
  } catch (error: any) {
    console.error("Admin Users GET API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) {
      await client.end().catch((err: any) => console.error("Error closing pg client:", err));
    }
  }
}
