import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ScheduleBody {
  content: string;
  platform: "twitter" | "linkedin";
  scheduledFor: string;
  playbookId?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ScheduleBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, platform, scheduledFor, playbookId } = body;

  if (!content?.trim() || !platform || !scheduledFor) {
    return NextResponse.json({ error: "Missing required fields: content, platform, scheduledFor" }, { status: 400 });
  }
  if (!["twitter", "linkedin"].includes(platform)) {
    return NextResponse.json({ error: "platform must be 'twitter' or 'linkedin'" }, { status: 400 });
  }

  // ── Mock mode ────────────────────────────────────────────────────────────────
  if (process.env.USE_MOCK_POSTIZ === "true") {
    await new Promise(r => setTimeout(r, 1000));
    const { error: dbError } = await supabase.from("scheduled_posts").insert({
      user_id: user.id,
      platform,
      content,
      scheduled_for: scheduledFor,
      status: "mock",
      playbook_id: playbookId ?? null,
    });
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ success: true, mock: true, scheduledFor });
  }

  // ── Live Postiz call ─────────────────────────────────────────────────────────
  const apiUrl = process.env.POSTIZ_API_URL;
  const apiKey = process.env.POSTIZ_API_KEY;
  const integrationId =
    platform === "twitter"
      ? process.env.POSTIZ_TWITTER_INTEGRATION_ID
      : process.env.POSTIZ_LINKEDIN_INTEGRATION_ID;

  if (!apiUrl || !apiKey || !integrationId) {
    return NextResponse.json(
      { error: "Postiz is not configured — set POSTIZ_API_URL, POSTIZ_API_KEY, and the relevant POSTIZ_*_INTEGRATION_ID env vars." },
      { status: 503 }
    );
  }

  let postizPostId: string | null = null;
  try {
    const postizRes = await fetch(`${apiUrl}/public/v1/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        type: "schedule",
        date: scheduledFor,
        posts: [
          {
            integration: { id: integrationId },
            value: [{ content }],
          },
        ],
      }),
    });

    if (!postizRes.ok) {
      const errText = await postizRes.text();
      return NextResponse.json({ error: `Postiz returned ${postizRes.status}: ${errText}` }, { status: 502 });
    }

    const postizData = await postizRes.json();
    postizPostId = postizData?.id ?? null;
  } catch {
    return NextResponse.json({ error: "Could not reach Postiz instance" }, { status: 502 });
  }

  // Log to Supabase — non-fatal if this fails (post is already in Postiz)
  const { error: dbError } = await supabase.from("scheduled_posts").insert({
    user_id: user.id,
    platform,
    content,
    scheduled_for: scheduledFor,
    postiz_post_id: postizPostId,
    status: "scheduled",
    playbook_id: playbookId ?? null,
  });
  if (dbError) {
    console.error("[postiz/schedule] supabase insert failed:", dbError.message);
  }

  return NextResponse.json({ success: true, postizPostId, scheduledFor });
}
