import { getLLMClient, getModelId } from "@/lib/llm";
import { getTier2ChannelContext } from "@/lib/contentKnowledgeBase";
import { parseJSON } from "@/lib/extractJSON";

export const dynamic = "force-dynamic";

interface IdeasRequest {
  selectedChannels: string[];
  productName: string;
  productDescription: string;
  icpSummary: string;
}

async function generateIdea(
  channelName: string,
  productName: string,
  productDescription: string,
  icpSummary: string
) {
  const client = getLLMClient();
  const model = getModelId();
  const channelKnowledge = getTier2ChannelContext(channelName);

  const systemPrompt = `You are a video content strategist. You generate content IDEAS — not full scripts. The creative direction is your output; the founder films and delivers in their own voice.

${channelKnowledge ? `Use the following channel playbook to inform the idea — pick the most appropriate content category, apply the hook angles, and use the personalisation guidance:\n\n${channelKnowledge}` : `Generate a content idea for ${channelName}.`}

Return valid JSON only, no markdown wrapper.`;

  const userPrompt = `Generate one high-signal content idea for ${channelName}.

Product: ${productName}
What it does: ${productDescription}
Target user: ${icpSummary}

Choose the content category from the playbook above that best fits this product and ICP. Apply the hook angles, format recommendation, and personalisation prompt from that category.

Return JSON exactly:
{
  "video_title": "one strong, specific title",
  "concept": "3 sentences describing what the video covers",
  "hook": "the opening 2 sentences that would hook a viewer in the first 5 seconds",
  "format": "the recommended format from the playbook (e.g. founder_journey / quick_tutorial / hot_take_opinion / before_after / trend_response)",
  "why_this_works": "one sentence explaining why this format and angle works for this ICP on this platform",
  "personalisation_tip": "one specific instruction for the founder on how to make this idea personal using their own story or data"
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.75,
    max_tokens: 700,
  });

  const raw = completion.choices[0]?.message?.content || "";
  return parseJSON(raw);
}

export async function POST(request: Request) {
  const body: IdeasRequest = await request.json();
  const { selectedChannels, productName, productDescription, icpSummary } = body;

  if (!selectedChannels?.length || !productName) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const ideas = await Promise.all(
      selectedChannels.map(async (channelName) => {
        const idea = await generateIdea(
          channelName,
          productName,
          productDescription,
          icpSummary
        );
        return { channelName, ...idea };
      })
    );

    return Response.json({ ideas });
  } catch (err) {
    console.error("Content ideas generation error:", err);
    return Response.json({ error: "Ideas generation failed. Please try again." }, { status: 500 });
  }
}
