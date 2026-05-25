import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { runForUser, hasTodaysQueue } from "@/lib/hermes/run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { playbookId, force = false } = (await request.json()) as {
      playbookId: string;
      force?: boolean;
    };

    if (!playbookId) {
      return Response.json({ error: "playbookId required" }, { status: 400 });
    }

    // Prevent accidental double-generation unless forced
    if (!force && await hasTodaysQueue(user.id, playbookId)) {
      return Response.json({ alreadyGenerated: true, drafts: 0 });
    }

    const { data: pb } = await admin()
      .from("playbooks")
      .select("id, user_id, data")
      .eq("id", playbookId)
      .eq("user_id", user.id)
      .single();

    if (!pb) return Response.json({ error: "Playbook not found" }, { status: 404 });

    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / 86_400_000);

    const drafts = await runForUser(
      { id: pb.id, user_id: pb.user_id, data: pb.data as Record<string, unknown> },
      today,
      dayIndex
    );

    return Response.json({ success: true, drafts });
  } catch (err) {
    console.error("[hermes/generate]", err);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
