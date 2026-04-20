import { getLLMClient, getModelId } from "@/lib/llm";
import { getTier1ChannelContext } from "@/lib/contentKnowledgeBase";
import { parseJSON } from "@/lib/extractJSON";

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

async function generateBasePosts(
  channelName: string,
  productName: string,
  productDescription: string,
  icpSummary: string,
  channelKnowledge: string,
): Promise<{ gyaan: string; story: string }> {
  const client = getLLMClient();
  const model = getModelId();

  const systemPrompt = `You are a growth expert writing social media content. Write posts that feel completely native to the platform.

${channelKnowledge ? `Use this channel playbook for tone, format, hook style, and what to avoid:\n\n${channelKnowledge}` : `Write posts native to ${channelName}.`}

Return valid JSON only, no markdown wrapper.`;

  const userPrompt = `Generate 2 posts for ${channelName}.

Product: ${productName}
What it does: ${productDescription}
Target user: ${icpSummary}

Post 1 — "gyaan": A sharp educational insight or observation tied to the core problem. Make it worth reading even if the reader never hears of ${productName}.

Post 2 — "story": A founder's personal story about why they built this, or a user transformation. Make it feel like a real moment from this week, not a PR piece.

Return JSON exactly:
{ "gyaan": "...", "story": "..." }`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.75,
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content || "";
  return parseJSON(raw);
}

async function generateTrendingPost(
  channelName: string,
  productName: string,
  productDescription: string,
  icpSummary: string,
  channelKnowledge: string,
  trendingContext: string,
): Promise<string> {
  const client = getLLMClient();
  const model = getModelId();

  const systemPrompt = `You are a founder writing a single social media post on ${channelName}. You just came across a real conversation happening right now and you're reacting to it. Write like a human — specific, opinionated, slightly imperfect. Never mention AI.

${channelKnowledge ? `Platform tone guide:\n\n${channelKnowledge}` : ""}

Return plain text only — just the post, no JSON, no labels.`;

  const userPrompt = trendingContext
    ? `You found this real conversation happening right now:

${trendingContext}

Your product: ${productName} — ${productDescription}
Your audience: ${icpSummary}

Write a single ${channelName} post that hooks into this specific conversation. Reference the actual topic or pain being discussed. Don't pitch the product directly — position yourself as someone who deeply understands this problem. The post should feel like a natural reaction to what you just read, written in ${channelName}'s native style.`
    : `Write a trending-hook post for ${channelName} about the biggest current conversation in the ${icpSummary} space. React to a specific pain point as if you just saw it discussed somewhere online. Product context: ${productName} — ${productDescription}.`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 600,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
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
            { type: "gyaan" as const, content: basePosts.gyaan },
            { type: "story" as const, content: basePosts.story },
            { type: "trending" as const, content: trendingPost },
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
