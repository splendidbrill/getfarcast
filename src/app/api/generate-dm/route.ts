import { getLLMClient, getModelId } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      productName, 
      productDescription, 
      platform,
      username_or_name,
      bio_or_headline,
      matched_text_preview,
      matched_keyword,
      page_context
    } = body;

    if (!productName || !username_or_name) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    const client = getLLMClient();
    const model = getModelId();

    const systemPrompt = `You are an expert sales development representative who writes highly personalized, non-spammy direct messages.
Your goal is to write a short, human-sounding DM to a lead.
Do NOT use robotic greetings like "Dear [Name]" or "I hope this finds you well".
Keep it very short (under 50 words). Focus on why you are reaching out based on their recent activity and gently introduce your product if it's relevant, or just ask an engaging question to start a conversation.
DO NOT use placeholders. Generate the final text that the user can copy and paste.`;

    const userPrompt = `
Generate a DM for this lead on ${platform}.
Lead Name: ${username_or_name}
Lead Bio: ${bio_or_headline || "N/A"}
What they recently said/posted: "${matched_text_preview || "N/A"}"
Context of where they posted: ${page_context || "N/A"}
The keyword they matched: ${matched_keyword || "N/A"}

My Product: ${productName || "N/A"}
What my product does: ${productDescription || "N/A"}

Write a short, casual DM that references what they said, relates it to my product in a very soft way (or asks a relevant question), and invites a response. Just give me the DM text, nothing else.`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const dmText = completion.choices[0]?.message?.content?.trim() || "";

    return Response.json({ dm: dmText });
  } catch (err) {
    console.error("DM generation error:", err);
    return Response.json({ error: "Failed to generate DM." }, { status: 500 });
  }
}
