import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import type { DailyAnchor } from "../anchor";

export interface XPosts {
  am_hook: string;
  noon_update: string;
  pm_reply_bait: string;
}

function hardTruncate(text: string, limit = 280): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1) + "…";
}

export async function generateX(
  anchor: DailyAnchor,
  productName: string,
  productDescription: string
): Promise<XPosts> {
  const client = getLLMClient();
  const model = getModelId();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a fast-moving, slightly agitated builder posting on X/Twitter.

NON-NEGOTIABLE RULES:
- Each post: max 280 characters. Count carefully. This is a hard limit.
- Zero hashtags. Not one. Zero.
- No em-dashes (—)
- No excitement. No enthusiasm. No marketing language.
- Tone: frustrated and correct, not inspired
- Double line break between thoughts if multi-line

Generate exactly 3 posts. Return JSON only:
{
  "am_hook": "<stark contrarian 2-line observation. Compresses the anchor into a gut punch. Max 280 chars.>",
  "noon_update": "<raw, unpolished build-in-public update. You are in the trenches right now. Specific. Unglamorous. Max 280 chars.>",
  "pm_reply_bait": "<highly specific open-ended question that makes other founders want to show off expertise in the replies. Max 280 chars.>"
}`,
      },
      {
        role: "user",
        content: `Product: ${productName}
What it does: ${productDescription}

Daily Anchor: ${anchor.text}

Write all 3 posts. Verify each is under 280 characters before returning.`,
      },
    ],
    temperature: 0.78,
    max_tokens: 700,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = parseJSON<XPosts>(raw);

  return {
    am_hook: hardTruncate(result.am_hook ?? ""),
    noon_update: hardTruncate(result.noon_update ?? ""),
    pm_reply_bait: hardTruncate(result.pm_reply_bait ?? ""),
  };
}
