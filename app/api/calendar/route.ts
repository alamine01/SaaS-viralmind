import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// 1. GET: Fetch tasks for the current user and active collection
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("collection") || "General";

    const supabase = await createSupabaseServerClient();
    
    // Retrieve user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: tasks, error } = await supabase
      .from("calendar_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("collection_name", collectionName)
      .order("position", { ascending: true });

    if (error) {
      // If table is not created yet, return empty list gracefully instead of failing
      if (error.code === "P0001" || error.message.includes("does not exist")) {
        console.warn("Table calendar_tasks does not exist yet. Please run calendar_tasks_schema.sql in Supabase.");
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tasks || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new editorial task
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, platform, status, priority, label_color, scheduled_date, collection_name } = body;

    if (!title) {
      return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
    }

    // Get current max position to append to the end of the column
    const colName = collection_name || "General";
    const taskStatus = status || "ideas";

    const { data: existingTasks } = await supabase
      .from("calendar_tasks")
      .select("position")
      .eq("user_id", user.id)
      .eq("collection_name", colName)
      .eq("status", taskStatus);

    const nextPosition = existingTasks && existingTasks.length > 0
      ? Math.max(...existingTasks.map(t => t.position || 0)) + 1
      : 0;

    const { data: newTask, error } = await supabase
      .from("calendar_tasks")
      .insert({
        user_id: user.id,
        title,
        description: description || "",
        platform: platform || "other",
        status: taskStatus,
        priority: priority || "medium",
        label_color: label_color || "#6366f1",
        scheduled_date: scheduled_date || null,
        position: nextPosition,
        collection_name: colName
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PATCH: Update a single task or bulk update positions/statuses
export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();

    // Check if bulk update
    if (body.updates && Array.isArray(body.updates)) {
      const { updates } = body;
      
      // Perform updates sequentially or with promise.all
      const updatePromises = updates.map((upd: { id: string; status?: string; position: number }) => 
        supabase
          .from("calendar_tasks")
          .update({
            ...(upd.status ? { status: upd.status } : {}),
            position: upd.position
          })
          .eq("id", upd.id)
          .eq("user_id", user.id)
      );

      const results = await Promise.all(updatePromises);
      const firstError = results.find(r => r.error);
      
      if (firstError) {
        return NextResponse.json({ error: firstError.error?.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Single task update
    const { id, title, description, platform, status, priority, label_color, scheduled_date, position } = body;
    if (!id) {
      return NextResponse.json({ error: "ID de tâche manquant" }, { status: 400 });
    }

    const { data: updatedTask, error } = await supabase
      .from("calendar_tasks")
      .update({
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(platform !== undefined ? { platform } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(label_color !== undefined ? { label_color } : {}),
        ...(scheduled_date !== undefined ? { scheduled_date: scheduled_date || null } : {}),
        ...(position !== undefined ? { position } : {})
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Remove a task
export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de tâche manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("calendar_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
