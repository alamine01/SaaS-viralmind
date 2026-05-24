import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserQuotas } from "@/lib/quota-service";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const quotas = await getUserQuotas(supabase, user.id);
    return NextResponse.json(quotas);
  } catch (error: any) {
    console.error("Fetch Quotas API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
