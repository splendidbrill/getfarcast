import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RedditPost {
  title: string;
  score: number;
  comments: number;
}

interface RedditBrief {
  trends: string[];
  complaints: string[];
  memes: string[];
  nativeVocabulary: string[];
  contentAngles: string[];
}

async function fetchTopPosts(subreddit: string): Promise<RedditPost[]> {
  const after = Math.floor(Date.now() / 1000) - 86400; // last 24 hours
  const url = `https://api.pullpush.io/reddit/search/submission/?subreddit=${encodeURIComponent(subreddit)}&sort=score&size=25&after=${after}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "farcast-recon/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Reddit fetch failed: ${res.status}`);

  const data = await res.json() as {
    data: Array<{ title: string; score: number; num_comments: number }>;
  };

  return (data.data ?? [])
    .map((p) => ({ title: p.title, score: p.score, comments: p.num_comments }))
    .filter((p) => p.title);
}

export async function POST(request: Request) {
  try {
    const { subreddit, playbookId } = (await request.json()) as {
      subreddit: string;
      playbookId?: string;
    };

    if (!subreddit?.trim()) {
      return Response.json({ error: "subreddit is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const cleanSub = subreddit.replace(/^r\//, "").trim();
    const posts = await fetchTopPosts(cleanSub);

    if (posts.length === 0) {
      return Response.json(
        { error: "No posts found — subreddit may not exist or be private" },
        { status: 404 }
      );
    }

    const postsText = posts
      .map((p, i) => `${i + 1}. [${p.score} upvotes | ${p.comments} comments] "${p.title}"`)
      .join("\n");

    const client = getLLMClient();
    const model = getModelId();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a community intelligence analyst. Extract actionable content intelligence from subreddit data. Respond with valid JSON only — no prose outside the JSON object.",
        },
        {
          role: "user",
          content: `Analyze these top posts from r/${cleanSub} today:\n\n${postsText}\n\nReturn this exact JSON shape:\n{\n  "trends": ["<3-5 trending topics>"],\n  "complaints": ["<3-5 pain points being vented>"],\n  "memes": ["<2-3 recurring jokes or inside references>"],\n  "nativeVocabulary": ["<5-8 words/phrases this community uses that outsiders don't>"],\n  "contentAngles": ["<3-5 specific post ideas a founder could write to sound native here>"]\n}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 900,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const brief = parseJSON<RedditBrief>(raw);

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin.from("reddit_intel").insert({
      user_id: user.id,
      playbook_id: playbookId ?? null,
      subreddit: cleanSub,
      posts_scraped: posts.length,
      brief,
    });

    return Response.json({ subreddit: cleanSub, posts_scraped: posts.length, brief });
  } catch (err) {
    console.error("[reddit-recon]", err);
    return Response.json({ error: "Failed to run Reddit recon" }, { status: 500 });
  }
}
