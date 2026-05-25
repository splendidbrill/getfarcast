import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";

export interface DraftInput {
  platform: "linkedin" | "x" | "reddit";
  text: string;
}

export interface ScrubResult {
  platform: "linkedin" | "x" | "reddit";
  text: string;
}

const BANNED = [
  "delve", "unpack", "synergy", "leverage", "utilize", "streamline",
  "cutting-edge", "game-changer", "revolutionize", "seamlessly", "robust",
  "holistic", "ecosystem", "unlock", "empower", "navigate", "landscape",
  "journey", "pivotal", "transformative", "actionable", "deep dive",
  "in conclusion", "to summarize", "in summary", "i hope this helps",
].join(", ");

export async function scrubAITells(drafts: DraftInput[]): Promise<ScrubResult[]> {
  if (!drafts.length) return [];

  const client = getLLMClient();
  const model = getModelId();

  const payload = drafts.map((d, i) => ({ index: i, platform: d.platform, text: d.text }));

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a cynical senior editor. Strip AI tells from these drafts. Never add commentary. Never explain changes.

BANNED WORDS — replace with plain alternatives or cut the sentence: ${BANNED}

BANNED FORMATTING:
- Em-dashes (—) → comma or period
- Bolded colons (**Word:**) → plain text only
- Summary bows (In conclusion / To summarize) → delete entirely
- Hollow openers (It's worth noting / Importantly) → delete

PLATFORM HARD RULES:
- x posts: must be under 280 characters after edits. Cut ruthlessly if over.
- linkedin: no single-sentence paragraphs. Merge short paragraphs into prose.
- reddit: delete any phrase that sounds promotional.

Return ONLY a JSON array in input order. No prose, no explanation.
Format: [{"index": 0, "text": "..."}, {"index": 1, "text": "..."}]`,
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
    temperature: 0.15,
    max_tokens: 3500,
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  try {
    const results = parseJSON<Array<{ index: number; text: string }>>(raw);
    return drafts.map((d, i) => ({
      platform: d.platform,
      text: results.find((r) => r.index === i)?.text ?? d.text,
    }));
  } catch {
    return drafts.map((d) => ({ platform: d.platform, text: d.text }));
  }
}
