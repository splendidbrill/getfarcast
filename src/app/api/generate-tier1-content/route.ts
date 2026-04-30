import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import { scrubAITells } from "@/lib/humanVoice";
import { createClient } from "@/lib/supabase/server";
import { checkAndIncrementUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

interface Tier1Request {
  selectedChannels: string[];
  productName: string;
  productDescription: string;
  icpSummary: string;
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
4. NO formatting crutches (no bold text, no bullet points, no colons).
5. NO neat little bows ("Ultimately...", "At the end of the day...").
6. NO excessive adverbs or fake pleasantries. No exclamation marks unless quoting someone.`;

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

// ── LLM calls ───────────────────────────────────────────────────────────────

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
  const reddit = platform === "reddit";

  const returnFormat = reddit
    ? `Return valid JSON exactly matching this format: { "gyaan": { "title": "...", "body": "..." }, "story": { "title": "...", "body": "..." } }`
    : `Return valid JSON exactly matching this format: { "gyaan": "...", "story": "..." }`;

  const systemPrompt = `You are a day-zero startup founder writing your own organic social posts. You are writing for your peers, not a marketing team.

${ANTI_AI_SLOP}

${PLATFORM_PLAYBOOKS[platform]}

${returnFormat}`;

  let userPrompt: string;

  if (platform === "reddit") {
    userPrompt = `Task: Write 2 Reddit posts.
Product: ${productName}
Target audience: ${icpSummary}

Post 1 "gyaan" — Insight:
- Title: Lowercase, conversational, under 100 characters. No clickbait, include one specific detail.
- Body: Start with a strong, non-obvious statement about a real problem founders face.
- Include one concrete detail (a number, behavior, or real scenario).
- Sound like a founder who has actually seen this happen.
- End abruptly. Do not wrap it up nicely or summarize.
- Keep it tight (2-4 lines max).
- Do not mention the product.

Post 2 "story" — Founder Moment:
- Title: Lowercase, conversational, hinting at the situation. No clickbait.
- Body: Start in the middle of a thought, a call, or a realization.
- Include at least one specific detail (time, place, person, or exact line said).
- Make it feel like something you'd text a co-founder at midnight.
- No storytelling arc. Just state what happened.
- Avoid perfect grammar if needed to sound authentic.
- No "lessons learned" or "what this taught me".

Return JSON only.`;
  } else if (platform === "x") {
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

  if (reddit) {
    const parsed = parseJSON<{
      gyaan: { title: string; body: string };
      story: { title: string; body: string };
    }>(raw);
    return {
      gyaan: { title: scrubAITells(parsed.gyaan?.title ?? ""), content: scrubAITells(parsed.gyaan?.body ?? "") },
      story: { title: scrubAITells(parsed.story?.title ?? ""), content: scrubAITells(parsed.story?.body ?? "") },
    };
  }

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
  const reddit = platform === "reddit";

  const returnFormat = reddit
    ? `Return valid JSON exactly matching this format: { "title": "...", "body": "..." }`
    : `Return plain text only. No markdown, no quotes.`;

  const systemPrompt = `You are a day-zero startup founder writing your own organic social posts. You are writing for your peers, not a marketing team.

${ANTI_AI_SLOP}

${PLATFORM_PLAYBOOKS[platform]}

${returnFormat}`;

  const context = trendingContext || `a specific pain point in the ${icpSummary} space`;

  let userPrompt: string;

  if (platform === "reddit") {
    userPrompt = `Task: Write a Reddit post reacting to a recent trending topic or conversation.
Trending Context: ${context}
Target audience: ${icpSummary}

Rules:
- Title: Reference the trending topic in a casual, lowercase way.
- Body: React directly to the topic. Take a stance.
- Do not summarize the news. Assume the audience already knows about it.
- Sound like someone who has lived this exact problem and needed to vent.
- End when you're done talking. No call to action.

Return JSON only.`;
  } else if (platform === "x") {
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

  if (reddit) {
    const parsed = parseJSON<{ title: string; body: string }>(raw);
    return {
      title: scrubAITells(parsed?.title ?? ""),
      content: scrubAITells(parsed?.body ?? ""),
    };
  }
  return { content: scrubAITells(raw) };
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body: Tier1Request = await request.json();
  const { selectedChannels, productName, productDescription, icpSummary } = body;

  if (!selectedChannels?.length || !productName) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count 1 generation cycle (even if multiple channels) as 1 usage
  const usageCheck = await checkAndIncrementUsage(user.id, "content_generations", 1);
  if (!usageCheck.allowed) {
    return Response.json({ error: usageCheck.error }, { status: 403 });
  }

  try {
    const results = await Promise.all(
      selectedChannels.map(async (channelName) => {
        const [basePosts, trendingContext] = await Promise.all([
          generateBasePosts(channelName, productName, productDescription, icpSummary),
          fetchTrendingContext(channelName, icpSummary),
        ]);

        const trendingPost = await generateTrendingPost(
          channelName, productName, productDescription, icpSummary,
          trendingContext,
        );

        return {
          channelName,
          posts: [
            { type: "gyaan" as const, title: basePosts.gyaan.title, content: basePosts.gyaan.content },
            { type: "story" as const, title: basePosts.story.title, content: basePosts.story.content },
            { type: "trending" as const, title: trendingPost.title, content: trendingPost.content },
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
