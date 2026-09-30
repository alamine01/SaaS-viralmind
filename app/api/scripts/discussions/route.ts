import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// GET /api/scripts/discussions
// - Sans paramètre 'id' : Récupère la liste de toutes les discussions de l'utilisateur
// - Avec paramètre 'id' : Récupère les messages d'une discussion spécifique
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const collection = searchParams.get("collection") || "General";

    if (id) {
      // 1. Récupérer les messages d'une discussion spécifique
      const { data: messages, error: msgError } = await supabase
        .from("script_messages")
        .select("*")
        .eq("discussion_id", id)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;

      // Récupérer aussi l'en-tête de la discussion pour vérifier son existence/appartenance
      const { data: discussion, error: discError } = await supabase
        .from("script_discussions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (discError || !discussion) {
        return NextResponse.json({ error: "Discussion introuvable" }, { status: 404 });
      }

      return NextResponse.json({ discussion, messages: messages || [] });
    } else {
      // 2. Récupérer la liste des discussions filtrées par collection/workspace
      const { data: discussions, error: discError } = await supabase
        .from("script_discussions")
        .select("*")
        .eq("user_id", user.id)
        .eq("collection_name", collection)
        .order("updated_at", { ascending: false });

      if (discError) throw discError;

      return NextResponse.json(discussions || []);
    }
  } catch (error: any) {
    console.error("GET Discussions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/scripts/discussions
// - Crée une nouvelle discussion pour l'utilisateur connecté
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { title = "Nouveau Script", collection = "General" } = await req.json();

    const { data: discussion, error } = await supabase
      .from("script_discussions")
      .insert({
        user_id: user.id,
        title,
        collection_name: collection
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(discussion);
  } catch (error: any) {
    console.error("POST Discussions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/scripts/discussions
// - Renomme une discussion existante
export async function PUT(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { id, title } = await req.json();

    if (!id || !title) {
      return NextResponse.json({ error: "ID et titre requis" }, { status: 400 });
    }

    const { data: discussion, error } = await supabase
      .from("script_discussions")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(discussion);
  } catch (error: any) {
    console.error("PUT Discussions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/scripts/discussions
// - Supprime une discussion de script (les messages associés seront supprimés en cascade par PostgreSQL)
export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { error } = await supabase
      .from("script_discussions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Discussions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
