import { NextResponse } from "next/server";
import { generateScripts } from "@/lib/ai-service";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { concept, niche, tone, duration, userId } = await req.json();

    if (!concept) {
      return NextResponse.json({ error: "Concept manquant" }, { status: 400 });
    }

    // Fetch active voice profile if userId is provided
    let toneProfile = "";
    if (userId) {
      const { data: activeVoice } = await supabase
        .from("voice_profiles")
        .select("content")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();
      
      if (activeVoice?.content) {
        toneProfile = activeVoice.content;
      }
    }

    // 1. Générer via l'IA
    const script = await generateScripts(concept, niche || "Général", tone || "Viral", duration, toneProfile);

    return NextResponse.json(script);
  } catch (error: any) {
    console.error("Script Generation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
