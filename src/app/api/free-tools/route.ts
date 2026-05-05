import { getLLMClient, getModelId } from "@/lib/llm";

export const dynamic = "force-dynamic";

// ── Rate limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT = 20;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const ipMap = new Map<string, { count: number; resetAt: number }>();

// Prune stale entries whenever the map grows large to prevent unbounded memory use
function pruneIfNeeded() {
  if (ipMap.size < 5000) return;
  const now = Date.now();
  for (const [key, val] of ipMap) {
    if (now > val.resetAt) ipMap.delete(key);
  }
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  pruneIfNeeded();
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now > record.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true, retryAfter: 0 };
}

function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

type ToolSlug =
  | "twitter-bio-generator"
  | "linkedin-headline-generator"
  | "reddit-post-title-generator"
  | "hook-generator"
  | "thread-outline-generator"
  | "build-in-public-post-generator"
  | "icp-one-liner-generator"
  | "competitor-differentiator"
  | "startup-tagline-generator"
  | "product-hunt-tagline-generator"
  | "cold-dm-generator"
  | "reddit-comment-reply-generator"
  | "warm-lead-qualifier"
  | "product-hunt-launch-checklist"
  | "launch-day-post-planner"
  | "subreddit-finder"
  | "founder-about-me-generator"
  | "gtm-priority-ranker"
  | "waitlist-email-sequence-generator"
  | "viral-post-analyser";

const VALID_TOOLS: ToolSlug[] = [
  "twitter-bio-generator",
  "linkedin-headline-generator",
  "reddit-post-title-generator",
  "hook-generator",
  "thread-outline-generator",
  "build-in-public-post-generator",
  "icp-one-liner-generator",
  "competitor-differentiator",
  "startup-tagline-generator",
  "product-hunt-tagline-generator",
  "cold-dm-generator",
  "reddit-comment-reply-generator",
  "warm-lead-qualifier",
  "product-hunt-launch-checklist",
  "launch-day-post-planner",
  "subreddit-finder",
  "founder-about-me-generator",
  "gtm-priority-ranker",
  "waitlist-email-sequence-generator",
  "viral-post-analyser",
];

function buildPrompt(
  tool: ToolSlug,
  inputs: Record<string, string>
): { system: string; user: string } {
  switch (tool) {
    // ── Content Tools ──────────────────────────────────────────────────────
    case "twitter-bio-generator":
      return {
        system: `You are an expert copywriter specialising in Twitter/X bios for founders and creators. Rules: each bio must be under 160 characters; no fluffy adjectives (passionate, dedicated, driven, results-oriented); no generic "helping X do Y" unless it's sharp and specific; include at least one concrete detail per bio (a number, a product name, a specific outcome); end with a subtle hook or personality touch. Return a JSON array of exactly 3 strings.`,
        user: `Write 3 Twitter/X bio options.
Name/handle: ${inputs.name}
What they do: ${inputs.role}
Topics they post about: ${inputs.interests}

Return JSON only — no markdown, no explanation: ["bio1", "bio2", "bio3"]`,
      };

    case "linkedin-headline-generator":
      return {
        system: `You are an expert at writing LinkedIn headlines for founders, operators, and creators. Rules: max 220 characters each; lead with the most impressive specific fact or outcome; avoid buzzwords (passionate, results-driven, synergy, leverage); use the pipe | separator to stack two angles if it helps; sound like a person, not a job posting. Return a JSON array of exactly 5 strings.`,
        user: `Write 5 LinkedIn headline options.
Current role: ${inputs.role}
Industry / niche: ${inputs.industry}
Key result or skill: ${inputs.result}

Return JSON only — no markdown, no explanation: ["headline1", "headline2", "headline3", "headline4", "headline5"]`,
      };

    case "reddit-post-title-generator":
      return {
        system: `You are an expert at writing Reddit post titles that get upvotes and genuine engagement. Rules: no clickbait; match the honest, direct tone of Reddit communities; lead with the value or the story; use sentence case not Title Case; include a specific detail (number, timeframe, outcome) where natural; avoid question marks unless it genuinely is a question. Return a JSON array of exactly 5 strings.`,
        user: `Write 5 Reddit post title options.
Niche / subreddit type: ${inputs.niche}
What the post is about: ${inputs.idea}

Return JSON only — no markdown, no explanation: ["title1", "title2", "title3", "title4", "title5"]`,
      };

    case "hook-generator":
      return {
        system: `You are an expert at writing opening hooks for founder social media posts. Rules: the hook is the FIRST sentence only — it must stop the scroll; make it specific (use numbers, outcomes, surprising admissions); write in plain conversational English; no "I'm excited to share", no "Important lesson:", no rocket emojis; hooks can be a declarative statement, a story opener, a contrarian take, or a revealing admission. Return a JSON array of exactly 5 strings.`,
        user: `Write 5 opening hook options for a social post.
Idea or update: ${inputs.update}

Return JSON only — no markdown, no explanation: ["hook1", "hook2", "hook3", "hook4", "hook5"]`,
      };

    case "thread-outline-generator":
      return {
        system: `You are an expert at structuring Twitter/X threads for founders and creators. A good thread has: Tweet 1 = a strong hook that promises value; Tweets 2-6 = one clear point each with a 1-sentence placeholder; Tweet 7 = a CTA or summary. Keep each item to 1-2 short sentences as a structural placeholder, not a full tweet. Label each item (e.g. "Tweet 1 (Hook): ..."). Return a JSON array of exactly 7 strings.`,
        user: `Create a 7-tweet thread outline.
Topic: ${inputs.topic}

Return JSON only — no markdown, no explanation: ["Tweet 1 (Hook): ...", "Tweet 2: ...", "Tweet 3: ...", "Tweet 4: ...", "Tweet 5: ...", "Tweet 6: ...", "Tweet 7 (CTA): ..."]`,
      };

    case "build-in-public-post-generator":
      return {
        system: `You are an expert ghostwriter for founders who build in public. Write a single social post that is honest, specific, and human. Rules: open with a hook (first line stops the scroll); include what actually happened (use the specific detail the founder gave); share one genuine insight, emotion, or lesson; end with a soft CTA or reflection; 150-250 words; no hashtags; use at most one emoji for emphasis. Return a JSON array containing exactly 1 string (the full post).`,
        user: `Write one build-in-public post.
What happened this week: ${inputs.update}

Return JSON only — no markdown, no explanation: ["full post text here"]`,
      };

    // ── ICP & Positioning ────────────────────────────────────────────────────
    case "icp-one-liner-generator":
      return {
        system: `You are an expert at writing ICP (Ideal Customer Profile) statements for startups. Rules: be hyper-specific — name the job title, company stage, or life situation; name the trigger that makes them look for a solution right now; name the outcome they want, not the feature; keep each sentence under 30 words; no "businesses", "companies", "people who want to" — get granular. Return a JSON array of exactly 4 strings: the best ICP one-liner first, then 3 alternatives each with a different angle.`,
        user: `Write 1 primary ICP one-liner + 3 alternatives.
Product: ${inputs.product}

Return JSON only — no markdown, no explanation: ["primary ICP", "alternative 1", "alternative 2", "alternative 3"]`,
      };

    case "competitor-differentiator":
      return {
        system: `You are an expert at competitive positioning for startups. Write differentiators that are honest, specific, and impossible for the competitor to copy quickly. Rules: each differentiator must name the specific contrast (not "we're better" but "we do X while [competitor] only does Y"); write in plain English a founder can say in a sales call; no buzzwords (innovative, cutting-edge, best-in-class); each must be under 25 words. Return a JSON array of exactly 3 strings.`,
        user: `Write 3 differentiator one-liners.
Our product: ${inputs.product}
Competitors: ${inputs.competitors}

Return JSON only — no markdown, no explanation: ["differentiator1", "differentiator2", "differentiator3"]`,
      };

    case "startup-tagline-generator":
      return {
        system: `You are an expert at writing startup taglines. Generate 10 options across different creative angles: (1) outcome-led, (2) pain-led, (3) bold claim, (4) comparison/contrast, (5) time-based, (6) founder-identity, (7) minimalist, (8) curiosity gap, (9) specific metric, (10) category creation. Each tagline must be under 10 words; no "the X for Y" structure unless it's exceptional; no "unlock", "supercharge", "revolutionise". Return a JSON array of exactly 10 strings.`,
        user: `Write 10 startup tagline options in different styles.
Product: ${inputs.product}

Return JSON only — no markdown, no explanation: ["tagline1", "tagline2", ..., "tagline10"]`,
      };

    case "product-hunt-tagline-generator":
      return {
        system: `You are an expert at Product Hunt launches. For the tagline: it must be under 60 characters, describe the outcome not the feature, use plain words, no punctuation at the end. For the first comment: it should be 100-150 words; tell the founder's story and why they built this; mention the problem it solves; invite early feedback; end with a genuine question to spark engagement; sound like a real person, not a press release. Return a JSON array of exactly 2 strings: [tagline, first_comment].`,
        user: `Write a Product Hunt tagline (under 60 chars) and a first comment draft.
Product: ${inputs.product}

Return JSON only — no markdown, no explanation: ["tagline under 60 chars", "first comment draft 100-150 words"]`,
      };

    // ── Outreach & Leads ─────────────────────────────────────────────────────
    case "cold-dm-generator":
      return {
        system: `You are an expert at writing cold DMs for founders on Twitter/X and LinkedIn. Rules: open with something specific about them (not "I love your work"); get to the point in line 2; make the ask small and low-friction; never mention your product features, only the outcome for them; each DM must be under 80 words; no "I hope this message finds you well", no emojis, no "quick question". Return a JSON array of exactly 3 strings.`,
        user: `Write 3 cold DM templates.
Who they're targeting: ${inputs.target}
What they want from them: ${inputs.goal}

Return JSON only — no markdown, no explanation: ["dm1", "dm2", "dm3"]`,
      };

    case "reddit-comment-reply-generator":
      return {
        system: `You are an expert at writing Reddit replies that add genuine value and subtly position a product — without being spammy. Rules: lead with actual help (answer the question, share a relevant experience, validate their pain); mention the product only if it's genuinely the right answer, and frame it as a suggestion not an ad; if mentioning the product, disclose you built it; keep it under 120 words; write like a human, not a marketer. Return a JSON array containing exactly 1 string.`,
        user: `Write a Reddit reply that adds value and subtly positions the product.
Reddit thread/comment: ${inputs.thread}
Product context: ${inputs.product}

Return JSON only — no markdown, no explanation: ["reply text here"]`,
      };

    case "warm-lead-qualifier":
      return {
        system: `You are an expert at identifying warm leads for startups from social media posts. Analyse the content and return a structured assessment with three sections: VERDICT (YES or NO, with a confidence level), WHY (2-3 sentences explaining the buying signals or lack thereof), and SUGGESTED MESSAGE (if YES: a specific 2-3 sentence reply or DM they could send right now; if NO: what signal to watch for instead). Be direct — founders don't have time for hedging. Return a JSON array containing exactly 1 string with line breaks between sections.`,
        user: `Qualify this as a warm lead.
Tweet or comment: ${inputs.content}
Our product: ${inputs.product}

Return JSON only — no markdown, no explanation: ["VERDICT: YES/NO — [confidence]\n\nWHY:\n[reasoning]\n\nSUGGESTED MESSAGE:\n[what to say]"]`,
      };

    // ── Launch & Distribution ────────────────────────────────────────────────
    case "product-hunt-launch-checklist":
      return {
        system: `You are an expert at Product Hunt launches. Generate a personalised week-by-week pre-launch content checklist. Each checklist item must: name the specific action (post, DM, reach out, etc.); name the platform; give a one-sentence description of what to post or do; be realistic and ordered from launch date backward. Structure as time-phased items (e.g. "4 weeks before launch:", "3 weeks before:", "2 weeks before:", "1 week before:", "Launch day:", "Day after launch:"). Return a JSON array of strings — one string per time phase, with the phase label and 2-4 actions listed within it.`,
        user: `Generate a personalised pre-launch checklist.
Product: ${inputs.product}
Launch timing: ${inputs.launch_date}

Return JSON only — no markdown, no explanation: ["4 weeks before launch:\\n- Action 1\\n- Action 2", "3 weeks before launch:\\n- Action 1", ...]`,
      };

    case "launch-day-post-planner":
      return {
        system: `You are an expert at orchestrating product launches on Product Hunt, Hacker News, and Reddit. Create a time-ordered launch day plan — not the actual post copy, just what to post, in what format, on which platform, and when. Rules: be specific about timing (use clock times in PST where relevant); account for platform quirks (PH launches 12:01am PST; HN Show HN works best 9-11am ET weekdays; Reddit requires genuine engagement not just link drops); include community-management tasks (replying to comments, upvote asks); cover the full arc from pre-midnight prep to end-of-day follow-up. Return a JSON array of 7-10 strings, each 2-3 sentences describing one scheduled action.`,
        user: `Create a launch day post plan.
Product: ${inputs.product}
Launch platform(s): ${inputs.platform}

Return JSON only — no markdown, no explanation: ["action1 description", "action2 description", ...]`,
      };

    // ── Utility ──────────────────────────────────────────────────────────────
    case "subreddit-finder":
      return {
        system: `You are an expert at Reddit marketing for startup founders. Identify 8 subreddits where the given ICP actively participates. For each subreddit include: community vibe and typical member, post formats that get upvoted (not just allowed — actually upvoted), specific behaviours that get posts removed or accounts shadow-banned, and one concrete post type that works well. Be honest about communities that are hostile to self-promotion. Return a JSON array of exactly 8 strings, each formatted with the subreddit name on the first line, then the details on labelled lines below.`,
        user: `Find 8 subreddits for this ICP.
ICP: ${inputs.icp}

Return JSON only — no markdown, no explanation: ["r/subredditname\\nBest for: [one line]\\nWhat works: [post types that get upvoted]\\nWatch out: [what gets banned or downvoted]", ...]`,
      };

    case "founder-about-me-generator":
      return {
        system: `You write founder About Me copy for websites, Product Hunt profiles, and investor intros. Write 3 versions in distinct tones: (1) Humble — leads with the problem and the journey, modest about achievements, relatable; (2) Authoritative — leads with credentials and results, confident, no fluff; (3) Personal — leads with a specific moment or emotion, conversational, the reader feels they know you. Rules: ground every version in the specific facts given; no "passionate entrepreneur", no "serial founder" unless specified; each version 80-120 words; lead with what they built, not their childhood. Label each version with its tone. Return a JSON array of exactly 3 strings.`,
        user: `Write 3 About Me versions.
Name: ${inputs.name}
Product: ${inputs.product}
Background: ${inputs.background}

Return JSON only — no markdown, no explanation: ["Humble:\\n[text]", "Authoritative:\\n[text]", "Personal:\\n[text]"]`,
      };

    case "gtm-priority-ranker":
      return {
        system: `You are a GTM strategist for early-stage startups. Based on the product and current stage, rank the 5 most important distribution channels to focus on right now. Rules: be specific to their stage (pre-launch vs just-launched vs early traction vs scaling); the reason must reference their specific situation — not a generic "Twitter is good for founders"; don't recommend channels that take 6+ months to bear fruit for founders who need traction now; each item under 35 words. Return a JSON array of exactly 5 strings, each formatted as: "#[rank] [Channel Name] — [one-line reason tied to their specific situation]"`,
        user: `Rank 5 GTM channels for this founder.
Product: ${inputs.product}
Current stage: ${inputs.stage}

Return JSON only — no markdown, no explanation: ["#1 Channel — reason", "#2 Channel — reason", "#3 Channel — reason", "#4 Channel — reason", "#5 Channel — reason"]`,
      };

    case "waitlist-email-sequence-generator":
      return {
        system: `You are an expert at writing SaaS waitlist email sequences that feel personal, not corporate. Write 3 emails: Email 1 (Day 0, sent on signup) = confirm signup, build excitement with specifics, set clear expectations for what's coming; Email 2 (Day 3) = deliver one immediately useful insight about the problem they're solving, remind them they're waiting on something worth it, end with a light social proof or community CTA; Email 3 (Day 7) = create genuine launch urgency (not fake scarcity), give them a referral or sharing reason, clear single CTA. Rules: plain text only, no HTML formatting in the output; sound like the founder emailing personally, not a marketing team; max 150 words per email body; each email must have a subject line. Return a JSON array of exactly 3 strings, each starting with "Subject: [subject line]" then two line breaks then the email body.`,
        user: `Write a 3-email waitlist sequence.
Product name: ${inputs.product}
What it does + who it's for: ${inputs.description}

Return JSON only — no markdown, no explanation: ["Subject: [subject]\\n\\n[email body day 0]", "Subject: [subject]\\n\\n[email body day 3]", "Subject: [subject]\\n\\n[email body day 7]"]`,
      };

    case "viral-post-analyser":
      return {
        system: `You are an expert at deconstructing viral founder posts on Twitter/X and LinkedIn. Analyse the given post and return a breakdown with five labelled sections: HOOK TYPE (name the specific hook pattern used — e.g. specific number claim, personal failure admission, contrarian statement, unexpected insight, identity provocation, before/after reveal), STRUCTURE (how the post sequences information — what comes first, how it builds, how it ends), EMOTIONAL TRIGGER (the primary emotion activated in the reader — curiosity, fear of missing out, validation, surprise, inspiration, relatability, or a combination), REACH SIGNALS (specific elements in the post that indicate it was likely to spread — length, white space, conversation invitation, shareability), and THE ONE THING TO STEAL (a single replicable technique the reader should apply to their next post, written as a direct instruction). Be specific and critical — vague observations aren't useful. Return a JSON array containing exactly 1 string with the five sections separated by double line breaks.`,
        user: `Analyse this viral post.
Post: ${inputs.post}

Return JSON only — no markdown, no explanation: ["HOOK TYPE:\\n[analysis]\\n\\nSTRUCTURE:\\n[analysis]\\n\\nEMOTIONAL TRIGGER:\\n[analysis]\\n\\nREACH SIGNALS:\\n[analysis]\\n\\nTHE ONE THING TO STEAL:\\n[specific instruction]"]`,
      };
  }
}

function parseResults(raw: string): string[] {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    const lines = raw.split(/\n+/).map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return [raw];
}

export async function POST(request: Request) {
  const ip = getIp(request);
  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return Response.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Window": "900",
        },
      }
    );
  }

  const body = await request.json();
  const { tool, inputs } = body as { tool: ToolSlug; inputs: Record<string, string> };

  if (!tool || !inputs) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!VALID_TOOLS.includes(tool)) {
    return Response.json({ error: "Unknown tool." }, { status: 400 });
  }

  try {
    const client = getLLMClient();
    const model = getModelId();
    const { system, user } = buildPrompt(tool, inputs);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.85,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const results = parseResults(raw);

    return Response.json({ results });
  } catch (err) {
    console.error("Free tool generation error:", err);
    return Response.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
