import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import type { DailyAnchor } from "../anchor";

export type LinkedInDirective =
  | "framework_teardown"
  | "vulnerable_retrospective"
  | "contrarian_operator";

const DIRECTIVES: LinkedInDirective[] = [
  "framework_teardown",
  "vulnerable_retrospective",
  "contrarian_operator",
];

export function getLinkedInDirective(dayIndex: number): LinkedInDirective {
  return DIRECTIVES[dayIndex % 3];
}

const DIRECTIVE_PROMPT: Record<LinkedInDirective, string> = {
  framework_teardown: `DIRECTIVE: Framework Teardown
Turn the anchor into a step-by-step methodology. Lead with the problem. Build named steps (3-5). Give the framework a short memorable name the reader will repeat. Close with the friction point 90% of operators skip. Length: 220-300 words.`,

  vulnerable_retrospective: `DIRECTIVE: Vulnerable Retrospective
Frame the anchor around a costly mistake from roughly six months ago and the specific pivot that fixed it. The vulnerability must be quantified — dollar amount, months lost, or churn count. No moralizing. End with one operational takeaway that would have saved you. Length: 200-270 words.`,

  contrarian_operator: `DIRECTIVE: Contrarian Operator
Name a commonly accepted best practice related to the anchor. Calmly dismantle it with logic and one specific counter-example from the real world. No hyperbole. Sound like someone who was in the room when this advice failed. Length: 180-250 words.`,
};

export async function generateLinkedIn(
  anchor: DailyAnchor,
  productName: string,
  productDescription: string,
  dayIndex: number
): Promise<{ text: string; directive: LinkedInDirective }> {
  const directive = getLinkedInDirective(dayIndex);
  const client = getLLMClient();
  const model = getModelId();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a mature SaaS founder with strong opinions built from hard experience. You are writing a LinkedIn post.

ABSOLUTE BANS (zero exceptions):
- Em-dashes (—)
- "delve", "leverage", "utilize", "streamline", "synergy", "ecosystem", "unlock", "empower", "game-changer", "revolutionize", "seamlessly", "robust", "holistic", "actionable", "transformative"

FORMATTING BANS:
- Bolded colons (**Word:**) — never
- Single-sentence paragraphs (broetry) — merge into prose
- Summary bows ("In conclusion", "To summarize") — cut entirely

STYLE: Standard paragraphs. Short sentences, max 20 words. McKinsey rigor, founder voice. No excitement.

${DIRECTIVE_PROMPT[directive]}

Return JSON only: {"text": "<full linkedin post>"}`,
      },
      {
        role: "user",
        content: `Product: ${productName}
What it does: ${productDescription}

Daily Anchor: ${anchor.text}

Write the post now.`,
      },
    ],
    temperature: 0.72,
    max_tokens: 900,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = parseJSON<{ text: string }>(raw);

  return { text: result.text ?? "", directive };
}
