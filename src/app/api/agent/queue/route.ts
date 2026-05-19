import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type QueueStatus = "draft" | "ready" | "deployed" | "skipped";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/agent/queue — Extension polls (status=ready) or dashboard fetches all (status=all)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "ready";
    const playbookIdFilter = searchParams.get("playbookId");

    const now = new Date();
    const window15 = new Date(now.getTime() + 15 * 60 * 1000);

    let query = admin()
      .from("content_queue")
      .select("id, content, platform, scheduled_for, status, playbook_id, source, created_at")
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: statusParam === "all" ? false : true });

    if (statusParam !== "all") {
      query = query.eq("status", statusParam as QueueStatus);
      if (statusParam === "ready") {
        query = query.lte("scheduled_for", window15.toISOString());
      }
    }

    if (playbookIdFilter) {
      query = query.eq("playbook_id", playbookIdFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ posts: data ?? [] });
  } catch (err) {
    console.error("[queue GET]", err);
    return Response.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

// POST /api/agent/queue — Dashboard queues a new post
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const {
      content,
      platform,
      scheduledFor,
      playbookId,
      status = "ready",
    } = (await request.json()) as {
      content: string;
      platform: "twitter" | "linkedin";
      scheduledFor: string;
      playbookId?: string;
      status?: QueueStatus;
    };

    if (!content?.trim() || !platform || !scheduledFor) {
      return Response.json(
        { error: "content, platform, and scheduledFor are required" },
        { status: 400 }
      );
    }

    const { data, error } = await admin()
      .from("content_queue")
      .insert({
        user_id: user.id,
        content: content.trim(),
        platform,
        scheduled_for: scheduledFor,
        playbook_id: playbookId ?? null,
        status,
      })
      .select("id")
      .single();

    if (error) throw error;

    return Response.json({ id: data.id, success: true });
  } catch (err) {
    console.error("[queue POST]", err);
    return Response.json({ error: "Failed to add to queue" }, { status: 500 });
  }
}

// DELETE /api/agent/queue — Dashboard removes a post
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = (await request.json()) as { id: string };
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const { error } = await admin()
      .from("content_queue")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    console.error("[queue DELETE]", err);
    return Response.json({ error: "Failed to delete queue item" }, { status: 500 });
  }
}

// PATCH /api/agent/queue — Extension marks a post as deployed or skipped
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = (await request.json()) as {
      id: string;
      status: "deployed" | "skipped";
    };

    if (!id || !["deployed", "skipped"].includes(status)) {
      return Response.json({ error: "id and valid status required" }, { status: 400 });
    }

    const { error } = await admin()
      .from("content_queue")
      .update({
        status,
        ...(status === "deployed" ? { deployed_at: new Date().toISOString() } : {}),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error("[queue PATCH]", err);
    return Response.json({ error: "Failed to update queue item" }, { status: 500 });
  }
}
