import { getLLMClient, getModelId } from "@/lib/llm";
import { getTier1ChannelContext } from "@/lib/contentKnowledgeBase";
import { parseJSON } from "@/lib/extractJSON";
import { HUMAN_VOICE_RULES, scrubAITells } from "@/lib/humanVoice";

export const dynamic = "force-dynamic";

interface Tier1Request {
  selectedChannels: string[];
  productName: string;
  productDescription: string;
  icpSummary: string;
}

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

function isReddit(channelName: string): boolean {
  return channelName.toLowerCase().includes("reddit");
}

async function generateBasePosts(
  channelName: string,
  productName: string,
  productDescription: string,
  icpSummary: string,
  channelKnowledge: string,
): Promise<{ gyaan: BasePost; story: BasePost }> {
  const client = getLLMClient();
  const model = getModelId();
  const reddit = isReddit(channelName);

  const systemPrompt = `You are a founder writing your own social posts at night after a long day. You are NOT a marketing team. The posts must feel completely native to ${channelName} and unmistakably human.

${HUMAN_VOICE_RULES}

DO NOT write cold outreach, cold DMs, sales pitches, or email outreach. This is organic social content only.

${channelKnowledge ? `Platform playbook (tone, format, hooks, what to avoid):\n\n${channelKnowledge}` : `Write posts native to ${channelName}.`}

Return valid JSON only, no markdown wrapper.`;

  const redditTitleRules = `
REDDIT TITLE RULES (critical — Reddit posts live or die by the title):
- Lowercase, conversational. No Title Case. No clickbait.
- Must sound like a real Redditor posted it, not a marketer.
- Include one specific detail or a sharp question. Not vague.
- No emojis. No "Pro tip:" or "PSA:" openers. No brackets.
- Under 100 characters is ideal.`;

  const userPrompt = reddit
    ? `Write 2 Reddit posts for ${channelName}.

Product: ${productName}
What it does: ${productDescription}
Target user: ${icpSummary}

${redditTitleRules}

Post 1 "gyaan": A sharp, opinionated observation about the underlying problem. One concrete detail or number. No product mention. No moral at the end. Stop when the thought is done, even if it ends abruptly.

Post 2 "story": A real-feeling moment from this week. A specific place, time, or person. The kind of post a friend sends you at midnight, not a case study. Product can appear but only as a detail, never as the subject of the post.

Return JSON exactly (do not output anything else):
{ "gyaan": { "title": "...", "body": "..." }, "story": { "title": "...", "body": "..." } }`
    : `Write 2 posts for ${channelName}.

Product: ${productName}
What it does: ${productDescription}
Target user: ${icpSummary}

Post 1 "gyaan": A sharp, opinionated observation about the underlying problem. One concrete detail or number. No product mention. No moral at the end. Stop when the thought is done, even if it ends abruptly.

Post 2 "story": A real-feeling moment from this week. A specific place, time, or person. The kind of post a friend sends you at midnight, not a case study. Product can appear but only as a detail, never as the subject of the post.

Return JSON exactly (do not output anything else):
{ "gyaan": "...", "story": "..." }`;

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
  productName: string,
  productDescription: string,
  icpSummary: string,
  channelKnowledge: string,
  trendingContext: string,
): Promise<BasePost> {
  const client = getLLMClient();
  const model = getModelId();
  const reddit = isReddit(channelName);

  const systemPrompt = `You are a founder writing one reply-style post on ${channelName} right after seeing a conversation that made you react. Specific, opinionated, slightly imperfect. Never mention AI. Never explain what you are doing.

${HUMAN_VOICE_RULES}

DO NOT write cold outreach, cold DMs, sales pitches, or email outreach. This is organic social content only.

${channelKnowledge ? `Platform tone guide:\n\n${channelKnowledge}` : ""}

${reddit
  ? `Return valid JSON only: { "title": "lowercase conversational reddit title under 100 chars, no clickbait, one specific detail", "body": "the post itself" }`
  : `Return plain text only. Just the post itself. No JSON, no labels, no quotes wrapping the output.`}`;

  const userPrompt = trendingContext
    ? `You just saw this conversation happening:

${trendingContext}

Your product: ${productName}, ${productDescription}
Your audience: ${icpSummary}

Write one ${channelName} post reacting to it. Reference the actual topic. Do not pitch the product. Sound like someone who has lived this exact problem. Match ${channelName}'s native rhythm. End when you're done talking, not with a call to action.`
    : `Write one ${channelName} post reacting to a specific pain point in the ${icpSummary} space. Make it feel like you just had a conversation about it and needed to vent. Product context: ${productName}, ${productDescription}. Do not pitch the product.`;

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

  try {
    const results = await Promise.all(
      selectedChannels.map(async (channelName) => {
        const channelKnowledge = getTier1ChannelContext(channelName);

        // Fetch Serper and base posts in parallel
        const [basePosts, trendingContext] = await Promise.all([
          generateBasePosts(channelName, productName, productDescription, icpSummary, channelKnowledge),
          fetchTrendingContext(channelName, icpSummary),
        ]);

        const trendingPost = await generateTrendingPost(
          channelName, productName, productDescription, icpSummary,
          channelKnowledge, trendingContext,
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
