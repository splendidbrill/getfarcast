import { getLLMClient, getModelId } from "@/lib/llm";
import { getLaunchPlatformData } from "@/lib/contentKnowledgeBase";
import { extractJSON } from "@/lib/extractJSON";

export const dynamic = "force-dynamic";

interface LaunchRequest {
  platformKey: string;
  productName: string;
  productUrl?: string;
  productDescription: string;
  icpSummary: string;
  diaryContext?: string;
  tractionNumbers?: string;
}

// Maps each platform key to the JSON output format and section labels
const PLATFORM_OUTPUT_MAP: Record<string, { format: string; sections: string[] }> = {
  product_hunt: {
    format: '{ "tagline": "...", "description": "...", "maker_comment": "..." }',
    sections: ["tagline", "description", "maker_comment"],
  },
  hacker_news: {
    format: '{ "title": "...", "body": "..." }',
    sections: ["title", "body"],
  },
  indie_hackers: {
    format: '{ "title": "...", "body": "..." }',
    sections: ["title", "body"],
  },
  reddit_saas: {
    format: '{ "title": "...", "body": "..." }',
    sections: ["title", "body"],
  },
  devto: {
    format: '{ "title": "...", "body_markdown": "..." }',
    sections: ["title", "body_markdown"],
  },
  betalist: {
    format: '{ "tagline": "...", "description": "..." }',
    sections: ["tagline", "description"],
  },
  uneed: {
    format: '{ "tagline": "...", "description": "...", "maker_comment": "..." }',
    sections: ["tagline", "description", "maker_comment"],
  },
  microlaunch: {
    format: '{ "tagline": "...", "description": "..." }',
    sections: ["tagline", "description"],
  },
  medium_hashnode: {
    format: '{ "title": "...", "body": "..." }',
    sections: ["title", "body"],
  },
  linkedin_personal: {
    format: '{ "post": "..." }',
    sections: ["post"],
  },
  twitter_launch_thread: {
    format: '{ "tweets": ["tweet 1 text", "tweet 2 text", "tweet 3 text", "..."] }',
    sections: ["tweets"],
  },
};

const SECTION_LABELS: Record<string, string> = {
  tagline: "Tagline",
  description: "Description",
  maker_comment: "Maker Comment",
  title: "Title",
  body: "Post Body",
  body_markdown: "Article (Markdown)",
  post: "Post",
  tweets: "Thread",
};

function buildUserPrompt(
  platformData: any,
  req: LaunchRequest
): string {
  const template: string = platformData.generation_prompt?.user_prompt_template ?? "";
  const outputSpec = PLATFORM_OUTPUT_MAP[req.platformKey];

  const vars: Record<string, string> = {
    product_name: req.productName,
    product_url: req.productUrl || "https://your-product.com",
    problem_statement: req.productDescription,
    product_description: req.productDescription,
    technical_description: req.productDescription,
    product_description_bullets: req.productDescription,
    icp_summary: req.icpSummary,
    traction_numbers: req.tractionNumbers || "Early stage — no public numbers yet",
    diary_specific_moment: req.diaryContext || "Not provided",
    diary_honest_struggle: req.diaryContext || "Not provided",
    diary_moments: req.diaryContext || "Not provided",
    current_state: "Early access / beta",
    current_state_and_limitations: "Early access / beta — core features built, iterating on feedback",
    differentiator: `${req.productName} is built specifically for this problem by a founder who experienced it firsthand`,
    key_differentiator: `${req.productName} is built specifically for this problem by a founder who experienced it firsthand`,
    founder_reason_specific: req.diaryContext || "Built this because no existing solution solved the problem properly",
    specific_feedback_request: "General feedback on clarity and whether the product resonates",
    early_adopter_benefit: "Shape the roadmap, founding user status, direct access to founder",
    founder_name: "Founder",
    journey_duration: "several months",
    why_this_matters_to_founder: "This problem has been frustrating for years and existing solutions fall short",
    founder_background: "Technical founder who experienced this problem firsthand",
    early_proof: req.tractionNumbers || "Strong early interest from initial conversations",
    tech_stack: "Modern web stack",
    roadmap_next: "Expanding features based on early user feedback",
    competitor_weaknesses: "Existing tools are too generic and not built for this specific use case",
    tagline: `${req.productName} — ${req.productDescription.slice(0, 60)}`,
  };

  // Substitute template variables
  let prompt = template;
  for (const [key, val] of Object.entries(vars)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  }

  // Append output format instruction
  prompt += `\n\nReturn valid JSON only (no markdown wrapper) in this exact format:\n${outputSpec?.format ?? "{}"}`;

  return prompt;
}

function normaliseSections(
  platformKey: string,
  rawData: any
): { label: string; content: string }[] {
  const outputSpec = PLATFORM_OUTPUT_MAP[platformKey];
  if (!outputSpec) return [{ label: "Output", content: JSON.stringify(rawData) }];

  const sections: { label: string; content: string }[] = [];

  for (const key of outputSpec.sections) {
    const val = rawData[key];
    if (val === undefined || val === null) continue;

    let content: string;
    if (Array.isArray(val)) {
      // Twitter tweets — number each one
      content = (val as string[]).map((t, i) => `Tweet ${i + 1}:\n${t}`).join("\n\n---\n\n");
    } else {
      content = String(val);
    }

    sections.push({ label: SECTION_LABELS[key] ?? key, content });
  }

  return sections;
}

export async function POST(request: Request) {
  const body: LaunchRequest = await request.json();
  const { platformKey, productName, productDescription, icpSummary } = body;

  if (!platformKey || !productName || !productDescription) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  const platformData = getLaunchPlatformData(platformKey);
  if (!platformData) {
    return Response.json({ error: `Unknown platform: ${platformKey}` }, { status: 400 });
  }

  const client = getLLMClient();
  const model = getModelId();

  const systemPrompt = platformData.generation_prompt?.system
    ? `${platformData.generation_prompt.system}\n\nReturn valid JSON only, no markdown wrapper.`
    : `You are writing a launch post for ${platformData.platform_name}. Write in that platform's native language and tone. Return valid JSON only.`;

  const userPrompt = buildUserPrompt(platformData, body);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(extractJSON(rawContent));
    const sections = normaliseSections(platformKey, parsed);

    return Response.json({
      platformKey,
      platformName: platformData.platform_name,
      sections,
      timing: platformData.timing ?? null,
    });
  } catch (err) {
    console.error(`Launch post generation error for ${platformKey}:`, err);
    return Response.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
