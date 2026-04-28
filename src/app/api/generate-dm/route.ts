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

//     const systemPrompt = `You are an expert sales development representative who writes highly personalized, non-spammy direct messages.
// Your goal is to write a short, human-sounding DM to a lead.
// Do NOT use robotic greetings like "Dear [Name]" or "I hope this finds you well".
// Keep it very short (under 50 words). Focus on why you are reaching out based on their recent activity and gently introduce your product if it's relevant, or just ask an engaging question to start a conversation.
// DO NOT use placeholders. Generate the final text that the user can copy and paste.`;

//     const userPrompt = `
// Generate a DM for this lead on ${platform}.
// Lead Name: ${username_or_name}
// Lead Bio: ${bio_or_headline || "N/A"}
// What they recently said/posted: "${matched_text_preview || "N/A"}"
// Context of where they posted: ${page_context || "N/A"}
// The keyword they matched: ${matched_keyword || "N/A"}

// My Product: ${productName || "N/A"}
// What my product does: ${productDescription || "N/A"}

// Write a short, casual DM that references what they said, relates it to my product in a very soft way (or asks a relevant question), and invites a response. Just give me the DM text, nothing else.`;

const systemPrompt = `You are a busy startup founder casually reaching out to a peer. 
Your goal is to write a highly personalized, 1-to-1 direct message based on their recent activity.

CRITICAL "ANTI-AI SLOP" RULES - DO NOT VIOLATE:
1. NO transition words: Never use "Moreover", "Furthermore", "Additionally", "Importantly", "That said."
2. NO corporate jargon: Never use "Delve", "Unpack", "Synergies", "Leverage", "Holistic", "Navigate", "Complexities".
3. NO "therapist voice": Do not validate them with phrases like "powerful opportunity" or "lean into". 
4. NO formatting: No bold text, no bullet points, no colons.
5. NO neat little bows: Do not summarize at the end (e.g., "Ultimately, the goal is...", "At the end of the day").
6. NO staccato repetition or forced negation.
7. NO excessive adverbs: Do not use words ending in -ly to artificially boost emotion.
8. NO fake pleasantries: Never start with "Hope this finds you well", "Happy Tuesday", or "Dear [Name]".

THE COLD DM PLAYBOOK (Follow strictly):
1. Keep it short: Maximum 40 words. People do not read long messages.
2. Opening Line: Start directly with something about them based on their post. No small talk.
3. Value Offer: Answer "What do they get from this?" by focusing on how you can help solve their specific problem. Do NOT tell your own story. Do NOT pitch the product directly in the first message—build trust first.
4. Simple Call to Action: Make it incredibly easy for them to reply. Do not ask for a call. Use phrases like "Can I share a quick idea?" or "Open to a small suggestion?".

TONE:
Write in plain, conversational English. Use sentence case natively. Sound like a real human.`;

const userPrompt = `
Context for the DM:
Platform: ${platform}
Name: ${username_or_name}
Their Bio: ${bio_or_headline || "N/A"}
What they just posted: "${matched_text_preview || "N/A"}"
Keyword matched: ${matched_keyword || "N/A"}

My Product: ${productName || "N/A"}
What it does: ${productDescription || "N/A"}

Instructions for the DM:
1. Hook: Start with something specific about what they just posted (e.g., "saw your thread on X").
2. Value: Briefly state that you have encountered this problem or have an idea related to their post, without aggressively pitching ${productName}.
3. CTA: End with a low-friction question asking permission to share an idea (e.g., "open to a quick idea on this?", "can I share what worked for me?").

Output ONLY the final DM text. No quotes, no placeholders, no commentary.`;

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
