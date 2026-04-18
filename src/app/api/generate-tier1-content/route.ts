import { getLLMClient, getModelId } from "@/lib/llm";
import { getTier1ChannelContext } from "@/lib/contentKnowledgeBase";

export const dynamic = "force-dynamic";

interface Tier1Request {
  selectedChannels: string[];
  productName: string;
  productDescription: string;
  icpSummary: string;
}

async function generateChannelPosts(
  channelName: string,
  productName: string,
  productDescription: string,
  icpSummary: string
) {
  const client = getLLMClient();
  const model = getModelId();
  const channelKnowledge = getTier1ChannelContext(channelName);

  const systemPrompt = `You are a growth expert writing social media content. You have deep, channel-specific knowledge and always write posts that feel completely native to the platform.

${channelKnowledge ? `Use the following channel playbook to inform every decision — tone, format, hook style, CTA approach, and what to avoid:\n\n${channelKnowledge}` : `Write posts that feel native to ${channelName}.`}

Return valid JSON only, no markdown wrapper.`;

  const userPrompt = `Generate 2 posts for ${channelName} for Day 1 of a growth push.

Product: ${productName}
What it does: ${productDescription}
Target user: ${icpSummary}

Post 1 — "gyaan": An educational insight, sharp observation, or punchy quote tied to the core problem this product solves. Apply the hook formulas and platform-native tone from the playbook above. Make it genuinely useful to read even if the reader never hears of this product.

Post 2 — "story": A founder's personal story about why they built this, or a short user transformation story. Use the personalisation layer guidance from the playbook — make it feel like a real moment from this week, not a polished PR piece.

Apply the platform's content-to-avoid rules strictly. The posts should pass the test: would someone who has never heard of ${productName} still find this post worth reading?

Return JSON exactly:
{
  "gyaan": "full post text here",
  "story": "full post text here"
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.75,
    max_tokens: 1800,
  });

  let raw = completion.choices[0]?.message?.content || "";
  raw = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`No JSON object in response: ${raw.slice(0, 200)}`);
  return JSON.parse(raw.slice(start, end + 1));
}

export async function POST(request: Request) {
  const body: Tier1Request = await request.json();
  const { selectedChannels, productName, productDescription, icpSummary } = body;

  if (!selectedChannels?.length || !productName) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      selectedChannels.map(async (channelName) => {
        const posts = await generateChannelPosts(
          channelName,
          productName,
          productDescription,
          icpSummary
        );
        return {
          channelName,
          posts: [
            { type: "gyaan" as const, content: posts.gyaan },
            { type: "story" as const, content: posts.story },
            {
              type: "trending" as const,
              content:
                "Trending topics coming soon — Serper API integration in progress. Once live, this post will be based on real-time conversations your ICP is having right now.",
            },
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
