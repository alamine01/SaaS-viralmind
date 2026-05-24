export interface PlanLimits {
  monthlyAnalysis: number;
  dailyScripts: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { monthlyAnalysis: 5, dailyScripts: 3 },
  pro: { monthlyAnalysis: 50, dailyScripts: 20 },
  visionary: { monthlyAnalysis: 250, dailyScripts: 100 },
  titan: { monthlyAnalysis: 1500, dailyScripts: 9999 } // 9999 signifie illimité en pratique
};

export async function getUserQuotas(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Profil utilisateur introuvable.");
  }

  const plan = (profile.plan || "free").toLowerCase();
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  let currentScriptCount = profile.daily_script_count || 0;
  let lastScriptReset = profile.last_script_reset;
  let currentAnalysisCount = profile.monthly_analysis_count || 0;
  let lastAnalysisReset = profile.last_analysis_reset;

  let needsUpdate = false;
  const updates: Record<string, any> = {};

  const now = new Date();

  // Reset quotidien des scripts (24h)
  const scriptResetDate = lastScriptReset ? new Date(lastScriptReset) : new Date(0);
  if (now.getTime() - scriptResetDate.getTime() >= 24 * 60 * 60 * 1000) {
    currentScriptCount = 0;
    updates.daily_script_count = 0;
    updates.last_script_reset = now.toISOString();
    needsUpdate = true;
  }

  // Reset mensuel des analyses (30 jours)
  const analysisResetDate = lastAnalysisReset ? new Date(lastAnalysisReset) : new Date(0);
  if (now.getTime() - analysisResetDate.getTime() >= 30 * 24 * 60 * 60 * 1000) {
    currentAnalysisCount = 0;
    updates.monthly_analysis_count = 0;
    updates.last_analysis_reset = now.toISOString();
    needsUpdate = true;
  }

  if (needsUpdate) {
    await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
  }

  return {
    plan,
    limits,
    daily_script_count: currentScriptCount,
    monthly_analysis_count: currentAnalysisCount,
    last_script_reset: updates.last_script_reset || lastScriptReset,
    last_analysis_reset: updates.last_analysis_reset || lastAnalysisReset,
  };
}

export async function checkAndIncrementScriptQuota(supabase: any, userId: string) {
  const quotas = await getUserQuotas(supabase, userId);
  
  if (quotas.daily_script_count >= quotas.limits.dailyScripts) {
    return {
      allowed: false,
      remaining: 0,
      limit: quotas.limits.dailyScripts,
      plan: quotas.plan
    };
  }

  const newCount = quotas.daily_script_count + 1;
  await supabase
    .from("profiles")
    .update({ daily_script_count: newCount })
    .eq("id", userId);

  return {
    allowed: true,
    remaining: quotas.limits.dailyScripts - newCount,
    limit: quotas.limits.dailyScripts,
    plan: quotas.plan
  };
}

export async function checkAndIncrementAnalysisQuota(supabase: any, userId: string) {
  const quotas = await getUserQuotas(supabase, userId);

  if (quotas.monthly_analysis_count >= quotas.limits.monthlyAnalysis) {
    return {
      allowed: false,
      remaining: 0,
      limit: quotas.limits.monthlyAnalysis,
      plan: quotas.plan
    };
  }

  const newCount = quotas.monthly_analysis_count + 1;
  await supabase
    .from("profiles")
    .update({ monthly_analysis_count: newCount })
    .eq("id", userId);

  return {
    allowed: true,
    remaining: quotas.limits.monthlyAnalysis - newCount,
    limit: quotas.limits.monthlyAnalysis,
    plan: quotas.plan
  };
}
