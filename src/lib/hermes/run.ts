import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateAnchor, recordAnchorUsed } from "./anchor";
import { generateLinkedIn, getLinkedInDirective } from "./engines/linkedin";
import { generateX } from "./engines/twitter";
import { generateReddit, hasRedditPostThisWeek } from "./engines/reddit";
import { scrubAITells } from "./scrub";
import { scoreVoiceFit } from "./score";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function scheduledTimes(base: Date) {
  const at = (h: number, m: number) => {
    const d = new Date(base);
    d.setUTCHours(h, m, 0, 0);
    return d.toISOString();
  };
  return {
    linkedin: at(9, 14),
    x_am: at(7, 30),
    x_noon: at(12, 15),
    x_pm: at(18, 45),
    reddit: at(10, 0),
  };
}

export function extractContext(data: Record<string, unknown>) {
  const pb = (data.playbook ?? data) as Record<string, unknown>;
  const fd = (data.formData ?? {}) as Record<string, unknown>;
  const productName = String(pb.productName ?? fd.productName ?? "the product");
  const productDescription = String(pb.summary ?? fd.productDescription ?? "");
  const industry = String(fd.industry ?? (pb.icp as Record<string, unknown>)?.title ?? "SaaS");
  const subMatches = JSON.stringify(data).match(/r\/[A-Za-z0-9_]+/g) ?? [];
  const subreddits = [...new Set(subMatches.map((s: string) => s.replace("r/", "")))].slice(0, 3);
  return { productName, productDescription, industry, subreddits };
}

export async function getUserSubreddits(userId: string, playbookId: string): Promise<string[]> {
  const { data } = await admin()
    .from("user_subreddits")
    .select("subreddits")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .single();
  return (data?.subreddits as string[] | null) ?? [];
}

export async function hasTodaysQueue(userId: string, playbookId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { data } = await admin()
    .from("daily_queue")
    .select("id")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .gte("created_at", startOfDay.toISOString())
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export interface PlaybookRow {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
}

export async function runForUser(
  pb: PlaybookRow,
  today: Date,
  dayIndex: number,
  force = false
): Promise<number> {
  const { productName, productDescription, industry, subreddits: fallbackSubs } = extractContext(pb.data);
  const times = scheduledTimes(today);

  // On force-regenerate, delete today's existing entries so we don't duplicate
  if (force) {
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    await admin()
      .from("daily_queue")
      .delete()
      .eq("user_id", pb.user_id)
      .eq("playbook_id", pb.id)
      .gte("created_at", startOfDay.toISOString());
  }

  const userSubs = await getUserSubreddits(pb.user_id, pb.id);
  const subreddits = userSubs.length > 0 ? userSubs : fallbackSubs;
  const primarySubreddit = subreddits[0] ?? "SaaS";

  const anchor = await generateAnchor(pb.user_id, pb.id, industry);
  if (!anchor.text) return 0;

  const rationaleTag = `HERMES RATIONALE: ${
    anchor.type === "competitor_weakness"
      ? "Attacking competitor structural weakness"
      : "Capitalizing on industry trend"
  }. Anchor: "${anchor.text.slice(0, 120)}"`;

  const directive = getLinkedInDirective(dayIndex);
  const skipReddit = force ? false : await hasRedditPostThisWeek(pb.user_id, pb.id);

  const [linkedinResult, xResult, redditResult] = await Promise.all([
    generateLinkedIn(anchor, productName, productDescription, dayIndex),
    generateX(anchor, productName, productDescription),
    skipReddit
      ? Promise.resolve(null)
      : generateReddit(anchor, productName, productDescription, pb.user_id, primarySubreddit),
  ]);

  const drafts = [
    { platform: "linkedin" as const, text: linkedinResult.text },
    { platform: "x" as const, text: xResult.am_hook },
    { platform: "x" as const, text: xResult.noon_update },
    { platform: "x" as const, text: xResult.pm_reply_bait },
    ...(redditResult
      ? [{ platform: "reddit" as const, text: `${redditResult.title}\n\n${redditResult.body}` }]
      : []),
  ];

  const scrubbed = await scrubAITells(drafts);

  const rows = [
    {
      user_id: pb.user_id,
      playbook_id: pb.id,
      platform: "linkedin",
      draft_text: scrubbed[0].text,
      rationale_tag: rationaleTag,
      voice_fit_score: scoreVoiceFit(scrubbed[0].text, "linkedin"),
      scheduled_time: times.linkedin,
      status: "pending_approval",
      linkedin_directive: directive,
      x_slot: null,
    },
    {
      user_id: pb.user_id,
      playbook_id: pb.id,
      platform: "x",
      draft_text: scrubbed[1].text,
      rationale_tag: rationaleTag,
      voice_fit_score: scoreVoiceFit(scrubbed[1].text, "x"),
      scheduled_time: times.x_am,
      status: "pending_approval",
      x_slot: "am_hook",
      linkedin_directive: null,
    },
    {
      user_id: pb.user_id,
      playbook_id: pb.id,
      platform: "x",
      draft_text: scrubbed[2].text,
      rationale_tag: rationaleTag,
      voice_fit_score: scoreVoiceFit(scrubbed[2].text, "x"),
      scheduled_time: times.x_noon,
      status: "pending_approval",
      x_slot: "noon_update",
      linkedin_directive: null,
    },
    {
      user_id: pb.user_id,
      playbook_id: pb.id,
      platform: "x",
      draft_text: scrubbed[3].text,
      rationale_tag: rationaleTag,
      voice_fit_score: scoreVoiceFit(scrubbed[3].text, "x"),
      scheduled_time: times.x_pm,
      status: "pending_approval",
      x_slot: "pm_reply_bait",
      linkedin_directive: null,
    },
    ...(redditResult && scrubbed[4]
      ? [{
          user_id: pb.user_id,
          playbook_id: pb.id,
          platform: "reddit",
          draft_text: scrubbed[4].text,
          rationale_tag: rationaleTag,
          voice_fit_score: scoreVoiceFit(scrubbed[4].text, "reddit"),
          scheduled_time: times.reddit,
          status: "pending_approval",
          x_slot: null,
          linkedin_directive: null,
        }]
      : []),
  ];

  const { error } = await admin().from("daily_queue").insert(rows);
  if (error) throw new Error(`daily_queue insert: ${error.message}`);

  await recordAnchorUsed(pb.user_id, pb.id, anchor);
  return rows.length;
}
