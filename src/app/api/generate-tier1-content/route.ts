import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import { scrubAITells } from "@/lib/humanVoice";
import { createClient } from "@/lib/supabase/server";
import { checkAndIncrementUsage } from "@/lib/usage";
import { fetchSubredditContext, validateSubreddit, type SubredditContext } from "@/lib/reddit/subreddits";

export const dynamic = "force-dynamic";

interface Tier1Request {
  selectedChannels: string[];
  productName: string;
  productDescription: string;
  icpSummary: string;
  playbookId: string;
}

// ── Platform helpers ─────────────────────────────────────────────────────────

type Platform = "reddit" | "x" | "linkedin";

function getPlatform(channelName: string): Platform {
  const n = channelName.toLowerCase();
  if (n.includes("reddit")) return "reddit";
  if (n.includes("linkedin")) return "linkedin";
  return "x";
}

const ANTI_AI_SLOP = `CRITICAL "ANTI-AI SLOP" RULES:
1. NO transition words ("Moreover", "Furthermore", "Additionally", "Importantly").
2. NO corporate jargon ("Delve", "Unpack", "Synergies", "Leverage", "Holistic", "Navigate").
3. NO "therapist voice" ("powerful opportunity", "lean into").
4. NO formatting crutches (no bold text, no bullet points, no colons, no ## markdown headers, no numbered "Step 1 / Step 2" frameworks).
5. NO neat little bows ("Ultimately...", "At the end of the day...").
6. NO excessive adverbs or fake pleasantries. No exclamation marks unless quoting someone.
7. NO long dashes (—). Use commas or periods instead.`;

const PLATFORM_PLAYBOOKS: Record<Platform, string> = {
  reddit: `REDDIT PLATFORM PLAYBOOK:
- Tone: Conversational, honest, self-deprecating. First-person always.
- Authenticity is everything. Reddit users will instantly detect and punish marketing language.
- Data and specifics over vague claims.
- NEVER promote the product directly in the post body. The post must be useful independently.`,
  x: `X (TWITTER) PLATFORM PLAYBOOK:
- Tone: Direct, opinionated, conversational. First-person always.
- Format: Short sentences. Punchy. Data beats vague claims.
- Vulnerability is a superpower. Humour works when authentic.
- NO corporate speak ever. Avoid "inspirational" quotes without original thought.`,
  linkedin: `LINKEDIN PLATFORM PLAYBOOK:
- Tone: Professional but human. First-person. Honest about failures.
- Format: Paragraphs are short (1-2 sentences) for readability.
- Avoid corporate press release tone, jargon, and buzzwords.
- Sounds like a smart colleague talking at a coffee meeting.
- NO engagement bait (e.g., "Comment YES if you agree").`,
};

// ── Serper ──────────────────────────────────────────────────────────────────

async function fetchTrendingContext(
  channelName: string,
  icpSummary: string,
): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return "";

  const channel = channelName.toLowerCase();
  const painPoint = icpSummary.split("Pain points:")[1]?.split(",")[0]?.trim() || icpSummary.slice(0, 80);

  const query = channel.includes("reddit")
    ? `site:reddit.com ${painPoint}`
    : painPoint;

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 1, tbs: "qdr:w" }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const top = data.organic?.[0];
    if (!top) return "";
    return `Title: ${top.title}\nSnippet: ${top.snippet}\nURL: ${top.link}`;
  } catch {
    return "";
  }
}

// ── LLM calls (X & LinkedIn) ─────────────────────────────────────────────────

interface BasePost { title?: string; content: string }

async function generateBasePosts(
  channelName: string,
  productName: string,
  _productDescription: string,
  icpSummary: string,
): Promise<{ gyaan: BasePost; story: BasePost }> {
  const client = getLLMClient();
  const model = getModelId();
  const platform = getPlatform(channelName);

  const systemPrompt = `You are a day-zero startup founder writing your own organic social posts. You are writing for your peers, not a marketing team.

${ANTI_AI_SLOP}

${PLATFORM_PLAYBOOKS[platform]}`;

  let userPrompt: string;

  if (platform === "x") {
    userPrompt = `Task: Write 2 X (Twitter) posts.
Product: ${productName}
Target audience: ${icpSummary}

Post 1 "gyaan" — Insight:
- Must be 1 to 2 lines maximum.
- State a deadpan, entirely serious observation about building startups or distribution.
- Focus on the unglamorous reality of the topic.
- No generic advice. Say the thing every founder is privately thinking but nobody typed.
- No formatting, no emojis, no hashtags.

Post 2 "story" — Founder Moment:
- Must be exactly 1 sentence.
- Describe an absurd, frustrating, or funny moment of building a product.
- Do not capitalize the first letter of the sentence. Keep it highly casual.
- Do not mention the product name directly.
- No emojis, no hashtags.

Return JSON only: { "gyaan": "...", "story": "..." }`;
  } else {
    userPrompt = `Task: Write 2 LinkedIn posts.
Product: ${productName}
Target audience: ${icpSummary}

Post 1 "gyaan" — Insight:
- Start with a sharp observation about a real problem in the ${icpSummary} space.
- Use normal, short paragraph spacing (1-2 sentences per paragraph). Do not use "broetry" (one sentence per line for 20 lines).
- Provide a slightly contrarian take on how things are usually done vs. how they should be done.
- No hashtags. No buzzwords. No frameworks.
- Do not conclude with "Thoughts?" or "What do you think?". End the post abruptly with your final point.

Post 2 "story" — Founder Moment:
- Start with a specific action or conversation that happened recently.
- Focus on the actual reality of building, not a glorified success story.
- Do not use a marketing-style hook (e.g., "Here is how I achieved X").
- Do not summarize what the story means at the end.
- Do not tag anyone or use hashtags.
- Keep it under 5 sentences.

Return JSON only: { "gyaan": "...", "story": "..." }`;
  }

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 1400,
  });

  const raw = completion.choices[0]?.message?.content || "";
  const parsed = parseJSON<{ gyaan: string; story: string }>(raw);
  return {
    gyaan: { content: scrubAITells(parsed.gyaan ?? "") },
    story: { content: scrubAITells(parsed.story ?? "") },
  };
}

async function generateTrendingPost(
  channelName: string,
  _productName: string,
  _productDescription: string,
  icpSummary: string,
  trendingContext: string,
): Promise<BasePost> {
  const client = getLLMClient();
  const model = getModelId();
  const platform = getPlatform(channelName);

  const systemPrompt = `You are a day-zero startup founder writing your own organic social posts. You are writing for your peers, not a marketing team.

${ANTI_AI_SLOP}

${PLATFORM_PLAYBOOKS[platform]}

Return plain text only. No markdown, no quotes.`;

  const context = trendingContext || `a specific pain point in the ${icpSummary} space`;

  let userPrompt: string;

  if (platform === "x") {
    userPrompt = `Task: Write a short X (Twitter) post reacting to a trend.
Trending Context: ${context}
Target audience: ${icpSummary}

Rules:
- Write it as if you are quote-tweeting the news.
- Must be 1 to 2 lines maximum.
- Provide a dry, sharp, or contrarian take on the news.
- Do not explain what the news is. Just give your reaction to it.
- No emojis, no hashtags.

Return plain text only.`;
  } else {
    userPrompt = `Task: Write a LinkedIn post reacting to a trending topic.
Trending Context: ${context}
Target audience: ${icpSummary}

Rules:
- Start with a sharp observation directly related to the trending topic.
- Use normal, short paragraph spacing (1-2 sentences per paragraph).
- Take a contrarian or honest stance.
- No hashtags. No buzzwords.
- End abruptly with your final point. No call to action.

Return plain text only.`;
  }

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.95,
    max_tokens: 700,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  return { content: scrubAITells(raw) };
}

// ── Reddit subreddit generation ──────────────────────────────────────────────

async function getOrCreateUserSubreddits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  playbookId: string,
  productName: string,
  productDescription: string,
  icpSummary: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("user_subreddits")
    .select("subreddits")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .single();

  if (data?.subreddits && data.subreddits.length >= 5) return data.subreddits as string[];

  // Generate candidates via LLM
  const client = getLLMClient();
  const model = getModelId();
  const completion = await client.chat.completions.create({
    model,
    messages: [{
      role: "user",
      content: `You are helping a founder find the best subreddits to post in.

Product: ${productName}
Product Description: ${productDescription}
Target Audience: ${icpSummary}

List 12 real, active subreddits where the BUYERS of this specific product hang out.
Think about what communities these people already participate in — industry forums, job-specific subs, tool-specific subs, pain-point subs.
Do NOT list generic subreddits (no r/AskReddit, r/funny, etc).
Do NOT list student or teenager subreddits unless the product is explicitly for students.
All subreddits must have >10,000 members and be publicly accessible.

Return JSON only: { "subreddits": ["SaaS", "Entrepreneur", "startups"] }
Do NOT include the r/ prefix. Subreddit names only.`,
    }],
    temperature: 0.3,
    max_tokens: 300,
  });

  const raw = completion.choices[0]?.message?.content || "";
  const parsed = parseJSON<{ subreddits: string[] }>(raw);
  const candidates: string[] = parsed?.subreddits ?? [];

  // Validate up to 12 candidates, keep first 10 that pass
  const valid: string[] = [];
  for (const sub of candidates.slice(0, 12)) {
    if (valid.length >= 10) break;
    const ok = await validateSubreddit(sub);
    if (ok) valid.push(sub);
  }

  // Fall back to raw candidates if validation yields too few
  const final = valid.length >= 5 ? valid : candidates.slice(0, 10);

  await supabase.from("user_subreddits").upsert(
    { user_id: userId, playbook_id: playbookId, subreddits: final, updated_at: new Date().toISOString() },
    { onConflict: "user_id,playbook_id" },
  );

  return final;
}

async function getOrCacheSubredditContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subreddit: string,
): Promise<SubredditContext> {
  const { data: cached } = await supabase
    .from("subreddit_cache")
    .select("rules, top_posts, fetched_at")
    .eq("subreddit", subreddit)
    .single();

  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at as string).getTime();
    if (ageMs < 24 * 60 * 60 * 1000) {
      return { subreddit, rules: cached.rules as string, topPosts: cached.top_posts as SubredditContext["topPosts"] };
    }
  }

  const context = await fetchSubredditContext(subreddit);

  await supabase.from("subreddit_cache").upsert({
    subreddit,
    rules: context.rules,
    top_posts: context.topPosts,
    fetched_at: new Date().toISOString(),
  });

  return context;
}

async function generateSingleRedditPost(
  ctx: SubredditContext,
  productName: string,
  productDescription: string,
  icpSummary: string,
  isSeeded: boolean,
) {
  const client = getLLMClient();
  const model = getModelId();

  const topPostsText = ctx.topPosts.length > 0
    ? ctx.topPosts.map((p, i) => `${i + 1}. "${p.title}"${p.selftext ? `\n   "${p.selftext}"` : ""}`).join("\n")
    : "No top posts available — use general Reddit conventions.";

  const rulesText = ctx.rules || "No specific rules found. Follow general Reddit etiquette.";

  const systemPrompt = `You are a startup founder writing a genuine Reddit post. You are not a marketer.

${ANTI_AI_SLOP}

REDDIT FORMAT RULES — ABSOLUTE:
- The body field must be plain prose paragraphs ONLY. This means: no markdown headers, no bullet points, no numbered lists, no bold, no italic, no "Step N:" sections. If your output contains any of these, it is wrong.
- Write the way a real person tells a story to another person. Not a tutorial. Not a blog post. Not a framework.
- Sentences start with capital letters. No emojis.
- No direct product URL anywhere in the body.
- End mid-thought or on a specific detail. No call to action.

Return valid JSON only.`;

  const sharedContext = `Subreddit: r/${ctx.subreddit}

Subreddit Rules:
${rulesText}

Top 5 Posts This Week (mirror their format and tone exactly):
${topPostsText}

Target Audience: ${icpSummary}`;

  const userContent = isSeeded
    ? `${sharedContext}

Product Name: ${productName}
What It Does: ${productDescription}

BODY FORMAT — THIS IS NON-NEGOTIABLE:
Write 2 to 4 plain paragraphs. Nothing else.
No headers. No bullet points. No numbered steps. No bold text. No "Step 1:", "Step 2:".
The body must read like a human typed it on their phone after a long day — not a blog post.

WHAT TO WRITE:
Tell a specific personal story. A mistake you made, something you noticed in your data, a conversation that stuck with you, a frustrating pattern you kept hitting. Make it concrete enough that a founder reading it would recognize their own situation.

Weave ${productName} into the story as background detail — like you're giving context about your situation, not pitching it.
NATURAL: "I was staring at the retention numbers in ${productName} on a Sunday and..."
NATURAL: "I built ${productName} because I kept running into this exact problem and..."
UNACCEPTABLE: "If you're dealing with this, ${productName} can help."
No URL or link in the body, ever.

Return JSON (body must be plain paragraphs only, no markdown):
{
  "flair": "Discussion",
  "title": "...",
  "body": "...",
  "instructions": "Wait for replies, then drop your link in the comments — not in the post."
}`
    : `${sharedContext}

BODY FORMAT — THIS IS NON-NEGOTIABLE:
Write 2 to 4 plain paragraphs. Nothing else.
No headers. No bullet points. No numbered steps. No bold text. No "Step 1:", "Step 2:".
The body must read like a human typed it on their phone — not a tutorial or blog post.

WHAT TO WRITE:
Tell a real story or share a counterintuitive observation. A specific moment, a data point that surprised you, something you tried that flopped, or a pattern you noticed after talking to a lot of people.
No product mentions of any kind.

Return JSON (body must be plain paragraphs only, no markdown):
{
  "flair": "Discussion",
  "title": "...",
  "body": "...",
  "instructions": "..."
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.9,
    max_tokens: 800,
  });

  const raw = completion.choices[0]?.message?.content || "";
  const parsed = parseJSON<{ flair: string; title: string; body: string; instructions: string }>(raw);

  return {
    type: "reddit_subreddit" as const,
    strategy: (isSeeded ? "seeded" : "pure_value") as "seeded" | "pure_value",
    subreddit: ctx.subreddit,
    flair: scrubAITells(parsed?.flair ?? ""),
    title: scrubAITells(parsed?.title ?? ""),
    content: scrubAITells(parsed?.body ?? ""),
    instructions: parsed?.instructions || (isSeeded
      ? "Wait for someone to reply, then drop your link in the comments — not before."
      : "Engage with replies first. Never post a link unprompted."),
  };
}

async function generateRedditChannelContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  playbookId: string,
  productName: string,
  productDescription: string,
  icpSummary: string,
) {
  const allSubreddits = await getOrCreateUserSubreddits(
    supabase, userId, playbookId, productName, productDescription, icpSummary,
  );

  // Pick 3 random subreddits
  const shuffled = [...allSubreddits].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, 3);

  // Fetch context for each (cached)
  const contexts = await Promise.all(
    chosen.map((sub) =>
      getOrCacheSubredditContext(supabase, sub).catch(() => ({
        subreddit: sub,
        rules: "",
        topPosts: [],
      }))
    ),
  );

  // 2 pure value + 1 seeded — pick seeded index randomly
  const seededIndex = Math.floor(Math.random() * Math.min(contexts.length, 3));

  const posts = await Promise.all(
    contexts.map((ctx, i) => generateSingleRedditPost(ctx, productName, productDescription, icpSummary, i === seededIndex)),
  );

  return { channelName: "Reddit", posts };
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body: Tier1Request = await request.json();
  const { selectedChannels, productName, productDescription, icpSummary, playbookId } = body;

  if (!selectedChannels?.length || !productName) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usageCheck = await checkAndIncrementUsage(user.id, "content_generations", 1);
  if (!usageCheck.allowed) {
    return Response.json({ error: usageCheck.error }, { status: 403 });
  }

  try {
    const results = await Promise.all(
      selectedChannels.map(async (channelName) => {
        const platform = getPlatform(channelName);

        if (platform === "reddit") {
          return generateRedditChannelContent(
            supabase, user.id, playbookId ?? "", productName, productDescription, icpSummary,
          );
        }

        const [basePosts, trendingContext] = await Promise.all([
          generateBasePosts(channelName, productName, productDescription, icpSummary),
          fetchTrendingContext(channelName, icpSummary),
        ]);

        const trendingPost = await generateTrendingPost(
          channelName, productName, productDescription, icpSummary, trendingContext,
        );

        return {
          channelName,
          posts: [
            { type: "gyaan" as const, content: basePosts.gyaan.content },
            { type: "story" as const, content: basePosts.story.content },
            { type: "trending" as const, content: trendingPost.content },
          ],
        };
      })
    );

    return Response.json({ channels: results });
  } catch (err) {
    console.error("Tier 1 generation error:", err);
    return Response.json({ error: "Content generation failed. Please try again." }, { status: 500 });
  }
}
