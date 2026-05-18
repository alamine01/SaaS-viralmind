import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // 'video' or 'script'

    let query = supabase
      .from("saved_items")
      .select(`
        *,
        video:video_id(*)
      `)
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);
    if (type) query = query.eq("type", type);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, videoId, content, type, collectionName } = await req.json();

    if (!userId || !type) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saved_items")
      .insert([
        {
          user_id: userId,
          video_id: videoId || null,
          content: content || null,
          type,
          collection_name: collectionName || "Default"
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
