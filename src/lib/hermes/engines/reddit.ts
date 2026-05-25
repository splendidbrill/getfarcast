import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import type { DailyAnchor } from "../anchor";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CachedPost {
  title: string;
  score?: number;
}

async function getTopPostsForSubreddit(subreddit: string): Promise<string> {
  // Check subreddit_cache first (populated by existing recon flow)
  const { data: cached } = await admin()
    .from("subreddit_cache")
    .select("top_posts, fetched_at")
    .eq("subreddit", subreddit)
    .single();

  // Use cache if fresh (within 48h)
  if (cached?.top_posts) {
    const age = Date.now() - new Date(cached.fetched_at as string).getTime();
    if (age < 48 * 3_600_000) {
      const posts: CachedPost[] = cached.top_posts as CachedPost[];
      return posts
        .slice(0, 5)
        .map((p, i) => `${i + 1}. "${p.title}"${p.score ? ` [${p.score} upvotes]` : ""}`)
        .join("\n");
    }
  }

  // Fallback: live fetch from pullpush.io
  const sub = encodeURIComponent(subreddit);
  const after7d = Math.floor(Date.now() / 1000) - 7 * 86_400;
  const urls = [
    `https://api.pullpush.io/reddit/search/submission/?subreddit=${sub}&sort=score&size=10&after=${after7d}`,
    `https://api.pullpush.io/reddit/search/submission/?subreddit=${sub}&sort=score&size=10`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "farcast-hermes/2.0" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) continue;
      const json = await res.json() as { data: Array<{ title: string; score: number }> };
      const posts = (json.data ?? []).filter((p) => p.title).slice(0, 5);
      if (posts.length > 0) {
        return posts.map((p, i) => `${i + 1}. "${p.title}" [${p.score} upvotes]`).join("\n");
      }
    } catch {
      continue;
    }
  }

  return "No recent posts available — write in a style typical for founder communities.";
}

async function getNativeVocab(userId: string, subreddit: string): Promise<string[]> {
  const { data } = await admin()
    .from("reddit_intel")
    .select("brief")
    .eq("user_id", userId)
    .eq("subreddit", subreddit)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data?.brief) return [];
  const brief = data.brief as { nativeVocabulary?: string[]; contentAngles?: string[] };
  return (brief.nativeVocabulary ?? brief.contentAngles ?? []).slice(0, 8);
}

export async function hasRedditPostThisWeek(userId: string, playbookId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await admin()
    .from("daily_queue")
    .select("id")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .eq("platform", "reddit")
    .gte("created_at", cutoff)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function generateReddit(
  anchor: DailyAnchor,
  productName: string,
  productDescription: string,
  userId: string,
  subreddit: string
): Promise<{ title: string; body: string } | null> {
  const [topPostsText, vocab] = await Promise.all([
    getTopPostsForSubreddit(subreddit),
    getNativeVocab(userId, subreddit),
  ]);

  const vocabList = vocab.length > 0 ? vocab.join(", ") : "PMF, churn, bootstrapped, LTV, CAC";

  const client = getLLMClient();
  const model = getModelId();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a peer on r/${subreddit} sharing a tactical masterclass. You are not marketing anything. You learned this the hard way.

NATIVE VOCABULARY — inject exactly 2 of these words/phrases naturally in the post body. NEVER in the first paragraph:
${vocabList}

STRUCTURAL BASELINE — match the title style and post depth of these recent top posts in r/${subreddit}:
${topPostsText}

CONTENT RULES:
- 90% of the post = step-by-step workflow the reader can execute WITHOUT ${productName}
- Final 10% = one casual mention: "I automated this part with ${productName}" or equivalent. Not a pitch. Not a CTA.
- Reddit native markdown only (## headers, - bullet points)
- No bolded colons anywhere
- First paragraph: no native vocabulary, no product name
- Sound like you learned this by losing money or time

Return JSON only: {"title": "<post title, no quotes>", "body": "<full post body in Reddit markdown>"}`,
      },
      {
        role: "user",
        content: `Product: ${productName}
What it does: ${productDescription}
Target subreddit: r/${subreddit}

Daily Anchor: ${anchor.text}

Write the post now.`,
      },
    ],
    temperature: 0.68,
    max_tokens: 1800,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = parseJSON<{ title: string; body: string }>(raw);
  if (!result.title || !result.body) return null;
  return result;
}
