import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/hermes/queue — Dashboard fetches today's queue
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const playbookId = searchParams.get("playbookId");
    const status = searchParams.get("status"); // pending_approval | approved | published | all
    const platform = searchParams.get("platform"); // linkedin | x | reddit

    let query = admin()
      .from("daily_queue")
      .select("id, platform, draft_text, rationale_tag, voice_fit_score, scheduled_time, status, x_slot, linkedin_directive, created_at")
      .eq("user_id", user.id)
      .order("scheduled_time", { ascending: true });

    if (playbookId) query = query.eq("playbook_id", playbookId);
    if (status && status !== "all") query = query.eq("status", status);
    if (platform) query = query.eq("platform", platform);

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ posts: data ?? [] });
  } catch (err) {
    console.error("[hermes/queue GET]", err);
    return Response.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

// PATCH /api/hermes/queue — Approve, publish, or skip a draft
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, draft_text } = (await request.json()) as {
      id: string;
      status: "approved" | "published" | "skipped";
      draft_text?: string;
    };

    if (!id || !["approved", "published", "skipped"].includes(status)) {
      return Response.json({ error: "id and valid status required" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { status };
    if (draft_text !== undefined) patch.draft_text = draft_text;

    const { error } = await admin()
      .from("daily_queue")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    console.error("[hermes/queue PATCH]", err);
    return Response.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

// DELETE /api/hermes/queue — Remove a draft
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = (await request.json()) as { id: string };
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const { error } = await admin()
      .from("daily_queue")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    console.error("[hermes/queue DELETE]", err);
    return Response.json({ error: "Failed to delete draft" }, { status: 500 });
  }
}
