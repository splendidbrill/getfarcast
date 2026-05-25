import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isPaidUser } from "@/lib/agent/burnerSession";
import { runForUser, type PlaybookRow } from "@/lib/hermes/run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function getActivePlaybooks(): Promise<PlaybookRow[]> {
  const { data: playbooks } = await admin()
    .from("playbooks")
    .select("id, user_id, data, created_at")
    .order("created_at", { ascending: false });

  if (!playbooks?.length) return [];

  const seen = new Set<string>();
  const unique: PlaybookRow[] = [];
  for (const pb of playbooks) {
    if (!seen.has(pb.user_id as string)) {
      seen.add(pb.user_id as string);
      unique.push(pb as PlaybookRow);
    }
  }

  const active: PlaybookRow[] = [];
  for (const pb of unique) {
    try {
      const { data: auth } = await admin().auth.admin.getUserById(pb.user_id);
      const status = auth?.user?.app_metadata?.subscription_status ?? null;
      if (isPaidUser(status)) active.push(pb);
    } catch {
      continue;
    }
  }

  return active;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayIndex = Math.floor(today.getTime() / 86_400_000);
  const results = { users: 0, drafts: 0, errors: 0 };

  try {
    const playbooks = await getActivePlaybooks();
    if (!playbooks.length) {
      return Response.json({ ...results, message: "No active users found" });
    }

    for (const pb of playbooks) {
      try {
        const count = await runForUser(pb, today, dayIndex);
        results.users++;
        results.drafts += count;
      } catch (err) {
        console.error(`[hermes-daily] user ${pb.user_id}:`, err);
        results.errors++;
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    return Response.json({ success: true, ...results });
  } catch (err) {
    console.error("[hermes-daily] fatal:", err);
    return Response.json({ error: "Hermes daily run failed", ...results }, { status: 500 });
  }
}
