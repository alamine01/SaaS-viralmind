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

    // Check if user is admin
    const quotas = await getUserQuotas(supabase, user.id);
    if (quotas.role !== "admin") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    client = getDbClient();
    await client.connect();

    // 1. Fetch real registration dates of users
    const signupRes = await client.query(`
      SELECT 
        TO_CHAR(COALESCE(p.created_at, u.created_at), 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      GROUP BY TO_CHAR(COALESCE(p.created_at, u.created_at), 'YYYY-MM-DD')
      ORDER BY date ASC;
    `);

    // 2. Fetch usage stats sum
    const usageRes = await client.query(`
      SELECT 
        SUM(daily_script_count) as total_scripts,
        SUM(monthly_analysis_count) as total_analyses,
        SUM(daily_upload_count) as total_uploads,
        COUNT(*) filter (where plan = 'free') as plan_free,
        COUNT(*) filter (where plan = 'pro') as plan_pro,
        COUNT(*) filter (where plan = 'visionary') as plan_visionary,
        COUNT(*) filter (where plan = 'titan') as plan_titan
      FROM profiles;
    `);

    const usage = usageRes.rows[0] || {
      total_scripts: 0,
      total_analyses: 0,
      total_uploads: 0,
      plan_free: 0,
      plan_pro: 0,
      plan_visionary: 0,
      plan_titan: 0
    };

    // Calculate MRR (Monthly Recurring Revenue) estimation
    // pro: 4900, visionary: 9900, titan: 29900
    const mrr = 
      (Number(usage.plan_pro) * 4900) + 
      (Number(usage.plan_visionary) * 9900) + 
      (Number(usage.plan_titan) * 29900);

    // 3. Fetch actual historical usage from saved_items table
    // Scripts generated (saved_items of type 'script')
    const scriptsRes = await client.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::integer as count
      FROM saved_items
      WHERE type = 'script' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD');
    `);

    // Analyses executed (saved_items of type 'video')
    const analysesRes = await client.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::integer as count
      FROM saved_items
      WHERE type = 'video' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD');
    `);

    const signupMap = new Map(signupRes.rows.map(r => [r.date, Number(r.count)]));
    const scriptsMap = new Map(scriptsRes.rows.map(r => [r.date, Number(r.count)]));
    const analysesMap = new Map(analysesRes.rows.map(r => [r.date, Number(r.count)]));

    // 4. Generate 30 days historical data for chart
    const last30Days = [];
    const now = new Date();
    let cumulativeUsers = 0;
    
    // Get total users registered before 30 days ago to start cumulative count correctly
    const priorCountRes = await client.query(`
      SELECT COUNT(*) as count
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE COALESCE(p.created_at, u.created_at) < NOW() - INTERVAL '30 days';
    `);
    cumulativeUsers = Number(priorCountRes.rows[0]?.count || 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      
      const signups = signupMap.get(dateStr) || 0;
      cumulativeUsers += signups;

      const scripts = scriptsMap.get(dateStr) || 0;
      const analyses = analysesMap.get(dateStr) || 0;

      last30Days.push({
        date: d.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }),
        signups,
        cumulativeUsers,
        scripts,
        analyses,
      });
    }

    // 5. Recent activities list
    const recentRes = await client.query(`
      SELECT 
        p.id,
        COALESCE(p.email, u.email) as email,
        p.full_name,
        p.plan,
        p.role,
        COALESCE(p.created_at, u.created_at) as created_at
      FROM profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      ORDER BY COALESCE(p.created_at, u.created_at) DESC
      LIMIT 6;
    `);

    const recentActivities = recentRes.rows.map(r => ({
      id: r.id,
      email: r.email || "Non renseigné",
      full_name: r.full_name || "Sans nom",
      plan: r.plan || "free",
      role: r.role || "user",
      created_at: r.created_at
    }));

    return NextResponse.json({
      success: true,
      mrr,
      summary: {
        totalUsers: cumulativeUsers,
        scriptsToday: Number(usage.total_scripts || 0),
        analysesThisMonth: Number(usage.total_analyses || 0),
        uploadsToday: Number(usage.total_uploads || 0),
      },
      planDistribution: {
        free: Number(usage.plan_free || 0),
        pro: Number(usage.plan_pro || 0),
        visionary: Number(usage.plan_visionary || 0),
        titan: Number(usage.plan_titan || 0),
      },
      chartData: last30Days,
      recentActivities
    });
  } catch (error: any) {
    console.error("Admin Analytics GET API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) {
      await client.end().catch(err => console.error("Error closing pg client:", err));
    }
  }
}
