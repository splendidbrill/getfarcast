import type { WizardFormData, ICPProfile } from "./types";

// ==========================================
// Prompt Engineering for GetFarcast Agency Engine
// ==========================================

const ANTI_SLOP_RULES = `## ANTI-SLOP RULES — ENFORCE STRICTLY
- NO em-dashes (—). Use commas or periods instead.
- NEVER use: "delve", "leverage", "utilize", "streamline", "cutting-edge", "game-changer", "revolutionize", "seamlessly", "robust", "holistic", "synergy", "ecosystem", "unlock", "empower"
- Sound like a real founder talking to another founder, not a marketing bot
- Include SPECIFIC numbers, dollar amounts, timeframes, and examples — not vague platitudes
- Keep sentences short. Max 20 words per sentence in social content.`;

const DISC_FRAMEWORK = `## DISC PERSONALITY FRAMEWORK
- D (Dominance): Results-oriented, decisive, competitive, direct. Motivated by winning, control, achievement.
- I (Influence): Enthusiastic, optimistic, collaborative, storyteller. Motivated by recognition and social connection.
- S (Steadiness): Supportive, reliable, patient, team-oriented. Motivated by stability and helping others.
- C (Conscientiousness): Analytical, detail-oriented, systematic, quality-focused. Motivated by accuracy and expertise.`;

// ==========================================
// Step 1: ICP Generation Prompt
// ==========================================
export function buildICPSystemPrompt(): string {
  return `You are GetFarcast AI — a senior growth strategist. Your ONLY job right now is to generate a precise, research-backed Ideal Customer Profile (ICP) for the given product.

## OUTPUT RULES
1. Return ONLY valid JSON. Zero text outside the JSON.
2. Be hyper-specific. "Tech-savvy professionals" is NOT acceptable. "Solo technical founders, 27-34, building their first SaaS" IS acceptable.
3. Every field must be specific to this exact product, not generic.

${ANTI_SLOP_RULES}

${DISC_FRAMEWORK}

## JSON SCHEMA — Return this exact structure:
{
  "title": "Short ICP descriptor e.g. 'Solo Technical Founder, 25-35'",
  "summary": "2-3 sentence precise ICP summary",
  "demographics": {
    "ageRange": "specific range e.g. 25-35",
    "gender": "e.g. 72% Male, 28% Female",
    "location": "e.g. US (45%), Europe (30%), India (15%), Other (10%)",
    "incomeRange": "e.g. $60K-$120K annually",
    "education": "e.g. Bachelor's or higher in CS/Engineering",
    "jobTitles": ["Most likely title", "Second most likely", "Third most likely"]
  },
  "psychographics": {
    "personalityTraits": ["Trait 1", "Trait 2", "Trait 3"],
    "values": ["Core value 1", "Core value 2"],
    "interests": ["Interest 1", "Interest 2", "Interest 3"],
    "frustrations": ["Specific frustration 1", "Specific frustration 2"],
    "spendingHabits": ["How they spend money 1", "How they spend money 2", "How they spend money 3"]
  },
  "discProfile": {
    "primaryType": "D|I|S|C",
    "secondaryType": "D|I|S|C",
    "description": "How this personality type thinks, what they care about, how they make decisions",
    "communicationStyle": "Exactly how to talk to this person to get their attention",
    "motivators": ["What drives them 1", "What drives them 2"],
    "stressors": ["What stresses them 1", "What stresses them 2"]
  },
  "buyingTriggers": ["Specific trigger that makes them buy NOW", "Second trigger", "Third trigger"],
  "painPoints": ["Specific raw pain point 1", "Specific raw pain point 2", "Specific raw pain point 3"],
  "currentAlternatives": [
    {"name": "What they use today", "weakness": "Why it falls short for their needs"}
  ]
}`;
}

export function buildICPUserPrompt(data: WizardFormData): string {
  return `## PRODUCT
Name: ${data.productName}
Description: ${data.productDescription}
Problem it solves: ${data.problemItSolves || "Not specified"}
Pricing: ${data.pricingModel}${data.pricePoint ? ` at ${data.pricePoint}` : ""}
Industry: ${data.industry || "Not specified"}

## FOUNDER'S GUESS AT AUDIENCE
${data.targetAudience || "Founder has no idea. Determine ICP entirely from the product description."}

## TASK
Generate the precise ICP JSON now. Be specific to this product. No generic answers.`;
}

// ==========================================
// Step 2: Channel Strategy Prompt (per channel, with injected KB)
// ==========================================
export function buildChannelSystemPrompt(
  channelName: string,
  channelPlaybook: string
): string {
  return `You are GetFarcast AI. You are writing the channel strategy AND 30-Day Content Calendar for "${channelName}" for an early-stage founder.

## CRITICAL: You have been given the EXACT expert playbook for ${channelName} below. You MUST apply these specific rules, timing data, format guidelines, and anti-patterns from this playbook when generating the strategy. Do NOT default to generic advice.

## EXPERT ${channelName.toUpperCase()} PLAYBOOK (apply these rules strictly):
${channelPlaybook}

## YOUR TASK
Using the expert playbook above AND the product/ICP information from the user, generate a complete ${channelName} channel strategy and a full 30-Day Content Calendar.

${ANTI_SLOP_RULES}

## OUTPUT RULES
1. Return ONLY valid JSON. Zero text outside the JSON.
2. The contentCalendar MUST contain exactly 15 sequential posts designed to be published over 30 days (e.g. Day 1, Day 3, Day 5, Day 7... up to Day 30).
3. Vary the post types (e.g., Value-add, Hot take, Origin story, Soft pitch, Interaction driver) to maintain an authentic feed.
4. Content must be COPY-PASTE READY. The founder should be able to post them TODAY with minimal edits.
5. All best practices and anti-patterns must be SPECIFIC to this channel AND this product. No generic advice.
6. The hook in each post must follow the specific hook formats described in the expert playbook.

## JSON SCHEMA:
{
  "name": "${channelName}",
  "rationale": "Specific reason this channel fits this product and ICP (2-3 sentences)",
  "audienceSize": "e.g. 180K members in r/SaaS, 2M in r/Entrepreneur",
  "engagementRate": "e.g. 3-5% for value-first posts in startup subreddits",
  "accessibility": "free|freemium|paid",
  "cac": "Estimated cost per acquisition e.g. '$0 cash, but 3 hours/week of time'",
  "timeToRoi": "e.g. '2-7 days for first traffic spike, 2-3 weeks for first paying user'",
  "bestPostingTimes": ["Day and time 1", "Day and time 2"],
  "algorithmInsights": [
    "Specific algorithm insight from the expert playbook, applied to this product"
  ],
  "bestPractices": [
    "Specific best practice from the expert playbook, applied to this product"
  ],
  "antiPatterns": [
    "Specific thing NOT to do, from the expert playbook"
  ],
  "influencerTargets": [
    {
      "handle": "Account name or description",
      "platform": "${channelName}",
      "audienceSize": "e.g. 45K followers",
      "why": "Why this influencer/community fits this product"
    }
  ],
  "contentCalendar": [
    {
      "day": 1,
      "type": "post|comment|reel|story|article|thread",
      "title": "Theme or concept of this post (e.g., Origin Story)",
      "hook": "The exact opening line. Must follow hook formats from the expert playbook.",
      "body": "Full post body. Ready to copy-paste with [OPTIONAL: minor product-specific edits in brackets]."
    }
  ]
}`;
}

export function buildChannelUserPrompt(
  icp: ICPProfile,
  data: WizardFormData,
  channelName: string,
  channelRank: number,
  pushType: "hard" | "soft",
  feedbackContext?: string
): string {
  return `## PRODUCT
Name: ${data.productName}
Description: ${data.productDescription}
Problem it solves: ${data.problemItSolves || "Not specified"}
Pricing: ${data.pricingModel}${data.pricePoint ? ` at ${data.pricePoint}` : ""}
Goal: ${data.primaryGoal === "first-100" ? "Get first 100 users" : data.primaryGoal === "launch" ? "Product launch buzz" : "Scale existing growth"}
Timeline: ${data.timeline === "2-weeks" ? "2 weeks" : data.timeline === "1-month" ? "1 month" : "3 months"}

## ICP SUMMARY
${icp.title}
Age: ${icp.demographics.ageRange} | Gender: ${icp.demographics.gender}
Job titles: ${icp.demographics.jobTitles.join(", ")}
DISC: ${icp.discProfile.primaryType}/${icp.discProfile.secondaryType} — ${icp.discProfile.description}
Key pain points: ${icp.painPoints.slice(0, 2).join("; ")}
Buying triggers: ${icp.buyingTriggers.slice(0, 2).join("; ")}

## CHANNEL CONTEXT
Channel: ${channelName}
Ranked #${channelRank} for this product
Intensity: ${pushType === "hard" ? "HARD push — primary channel, invest heavily here" : "SOFT push — secondary channel, maintain presence"}

${feedbackContext ? `## CRITICAL PERFORMANCE FEEDBACK FROM PREVIOUS 30 DAYS
The user ran a 30-day playbook last month. Here is EXACTLY what performed well and what flopped. Adapt this month's content immediately based on this data:
${feedbackContext}
` : ''}
Generate the complete ${channelName} strategy JSON now. Apply ALL rules from the expert playbook. Make the content templates READY TO POST TODAY.`;
}

// ==========================================
// Step 3: Outreach Prompt
// ==========================================
export function buildOutreachSystemPrompt(): string {
  return `You are GetFarcast AI. Your job is to write a cold outreach sequence (email + DMs) for an early-stage founder trying to get their first users.

${ANTI_SLOP_RULES}

## OUTREACH RULES
- Write like a real human, not a sales funnel automation
- First email must NOT mention the product. Build curiosity and rapport first.
- Each email has ONE clear ask. Not three asks.
- DMs must be short (under 80 words). Long DMs get ignored.
- Personalization hooks must be specific enough to feel human, not like a mail merge.
- Never use: "I came across your profile", "touch base", "circle back", "reach out", "following up"

## JSON SCHEMA:
{
  "emailSequence": [
    {
      "day": 1,
      "subject": "Subject line (under 50 chars, no punctuation at end)",
      "body": "Full email body. Human, specific, short. Under 150 words.",
      "purpose": "What this email is trying to accomplish"
    }
  ],
  "dmTemplates": [
    {
      "platform": "LinkedIn|Reddit|Instagram|X",
      "message": "Full DM. Under 80 words. Feels human.",
      "context": "Exact situation when to send this DM"
    }
  ]
}

Provide 4 emails (Day 1, Day 3, Day 7, Day 14).
Provide 3 DMs across different platforms.`;
}

export function buildOutreachUserPrompt(
  icp: ICPProfile,
  data: WizardFormData,
  topChannels: string[]
): string {
  return `## PRODUCT
Name: ${data.productName}
Description: ${data.productDescription}
Pricing: ${data.pricingModel}${data.pricePoint ? ` at ${data.pricePoint}` : ""}

## ICP
${icp.title}
Job titles: ${icp.demographics.jobTitles.join(", ")}
Pain points: ${icp.painPoints.join("; ")}
Buying triggers: ${icp.buyingTriggers.join("; ")}
DISC type: ${icp.discProfile.primaryType} — communicate with: ${icp.discProfile.communicationStyle}

## TOP CHANNELS (write DMs for these platforms)
${topChannels.join(", ")}

Generate the cold outreach sequence and DM templates now. Write to the DISC ${icp.discProfile.primaryType} communication style. Human, specific, short.`;
}

// ==========================================
// Step 4: Market Sizing Prompt
// ==========================================
export function buildMarketSizingSystemPrompt(): string {
  return `You are GetFarcast AI. Generate concise market sizing estimates for the given product.

## OUTPUT RULES
1. Return ONLY valid JSON.
2. Use realistic, defensible numbers with brief citations.
3. Be specific — don't say "large market," say "$4.2B global market."

## JSON SCHEMA:
{
  "tam": "Total Addressable Market with number and brief rationale",
  "sam": "Serviceable Addressable Market with number",
  "som": "Serviceable Obtainable Market — realistic 3-year target",
  "trendDirection": "growing|stable|declining",
  "trendRationale": "1-2 sentences on why the market is trending this way"
}`;
}

export function buildMarketSizingUserPrompt(
  icp: ICPProfile,
  data: WizardFormData
): string {
  return `Product: ${data.productName}
Description: ${data.productDescription}
ICP: ${icp.title}
Location spread: ${icp.demographics.location}
Pricing: ${data.pricingModel}${data.pricePoint ? ` at ${data.pricePoint}` : ""}

Generate market sizing JSON now.`;
}

// ==========================================
// Step 5: Ready-to-Post Calendar Prompt
// Posts are generated per-platform with the correct number based
// on each platform's optimal_posting_cadence from the JSON data.
// ==========================================
export function buildPostsCalendarSystemPrompt(channels: string[]): string {
  // Import the loadPlatforms function dynamically to avoid circular dependencies
  const { loadPlatforms } = require("@/lib/platforms/loader") as { loadPlatforms: () => any[] };
  const platforms = loadPlatforms();

  // Build per-platform rules + cadence context
  const channelRules = channels.map((ch) => {
    const platform = platforms.find((p: any) => p.channel === ch);
    if (platform) {
      const content = platform.content_system;
      const algo = platform.algorithm_playbook;
      const postCount = getPostCountForPlatform(ch, algo.optimal_posting_cadence);
      return `## ${ch.toUpperCase()} (generate exactly ${postCount} posts)
OPTIMAL POSTING CADENCE: ${algo.optimal_posting_cadence}
PEAK POSTING WINDOWS: ${algo.peak_posting_windows}
WINNING CONTENT TYPES: ${content.winning_content_types}
HOOK FORMULAS: ${content.hook_formulas}
PLATFORM NATIVE TONE: ${content.platform_native_tone}
CTA APPROACH: ${content.cta_approach}
CONTENT TO AVOID: ${content.content_to_avoid}`;
    } else {
      return `## ${ch.toUpperCase()} (generate exactly 7 posts)
OPTIMAL POSTING CADENCE: 1 post per day for the first week
PLATFORM NATIVE TONE: Authentic, specific, platform-appropriate.`;
    }
  }).join("\n\n");

  // Build the total post count summary
  const totalPosts = channels.reduce((sum, ch) => {
    const platform = platforms.find((p: any) => p.channel === ch);
    const cadence = platform?.algorithm_playbook?.optimal_posting_cadence || "";
    return sum + getPostCountForPlatform(ch, cadence);
  }, 0);

  return `You are GetFarcast AI — a world-class social media strategist and copywriter. Your job is to write a first-week post calendar where EVERY single post sounds like it was written by a real founder talking to their community — not a marketing AI.

## THE PLATFORMS YOU ARE WRITING FOR:
${channels.join(", ")}

## PLATFORM-SPECIFIC RULES AND POST COUNTS (follow these exactly):
${channelRules}

${ANTI_SLOP_RULES}

## HUMAN-SOUNDING POST RULES (CRITICAL — ENFORCE ON EVERY POST):
- Write in first person, like a founder talking to a friend or online community
- Use real, specific details — numbers, dates, specific situations
- Short paragraphs (2–3 lines max). Never wall-of-text.
- Vary sentence length. Mix short punchy sentences with slightly longer ones.
- Sound slightly imperfect — real humans don't write perfectly polished copy
- Include emotion: frustration, excitement, curiosity, doubt
- Avoid: "I'm thrilled to announce", "game-changer", "excited to share", "In conclusion", "In today's world"
- Never start with "I" — start with the situation, the problem, or a question
- For Reddit: conversational, no hashtags, end with a question to spark comments
- For LinkedIn: professional but personal, 3–5 short paragraphs, 2–3 hashtags max at the end
- For Twitter/X: punchy, opinionated, max 280 chars per tweet or thread format
- For TikTok/Instagram: hook in first 3 words, speak directly to the viewer, single CTA

## CONTENT PILLAR ROTATION (spread across all posts per platform):
- Origin Story: Why the founder built this. What specific pain point broke them.
- The Problem: Make the ICP feel seen. No product mention. Pure empathy.
- Behind the Scenes: One real insight from building. Specific numbers or struggles.
- Value-Add: Teach something useful about the problem space. No pitch.
- Hot Take: A bold, specific, defensible opinion that will get replies.
- Soft Pitch: Product reveal led by transformation story, not features.
- Community: Ask the ICP a question they genuinely want to answer.

## OUTPUT RULES:
1. Return ONLY valid JSON. Zero text outside the JSON block.
2. Generate exactly the number of posts specified per platform above. Total posts: ${totalPosts}.
3. The "hook" is the FIRST LINE ONLY — must make someone stop scrolling.
4. The "body" is the FULL POST including the hook. Copy-paste ready. No [PLACEHOLDER] text.
5. "characterCount" is the real character count of the body field.
6. "bestTimeToPost" — use the exact peak posting windows from the platform data above.
7. "subredditOrHashtags" — Reddit: specific subreddit like "r/SaaS, r/Entrepreneur". LinkedIn/X: 2–3 hashtags max. Others: leave empty string.

## JSON SCHEMA:
{
  "weekOf": "Week 1 — Launch Sprint",
  "posts": [
    {
      "day": 1,
      "platform": "Reddit",
      "postType": "Origin Story",
      "hook": "The exact first line that stops the scroll",
      "body": "Full ready-to-post text. Human. Specific. No filler.",
      "characterCount": 420,
      "bestTimeToPost": "Tuesday 9-11am EST",
      "subredditOrHashtags": "r/SaaS, r/Entrepreneur"
    }
  ]
}`;
}

// ==========================================
// Helper: determine how many posts to generate for a platform
// based on its optimal_posting_cadence field.
// Rules are ordered from most-specific to least-specific to
// avoid false matches (e.g. "daily" inside "commenting daily").
// ==========================================
export function getPostCountForPlatform(channelName: string, cadence: string): number {
  const lower = cadence.toLowerCase();
  const ch = channelName.toLowerCase();

  // ── One-shot / event-based channels — 1 post ─────────────────────────────
  if (
    ch.includes("product hunt") ||
    ch.includes("appsumo") ||
    ch.includes("betalist") ||
    ch.includes("hacker news") ||
    ch.includes("shopify app store") ||
    ch.includes("chrome web store") ||
    ch.includes("app store") ||     // App Store / Google Play
    ch.includes("g2") ||
    ch.includes("capterra")
  ) return 1;

  // ── Multiple-per-day channels — 7 posts (1 per day of week) ──────────────
  // Be specific: match explicit "per day" or "tweets/day" patterns
  if (
    lower.includes("videos per day") ||     // TikTok: "1-3 videos per day"
    lower.includes("tweets/day") ||          // Twitter: "3-5 tweets/day"
    lower.includes("posts/day") ||           // Threads: "3-5 posts/day"
    lower.match(/\d+-\d+ (times|posts|tweets|videos) (per|a) day/)
  ) return 7;

  // ── High-frequency: 3-5 posts per week — 5 posts ─────────────────────────
  if (
    lower.includes("3-5 tweets") ||          // Twitter: "3-5 tweets/day" already caught above
    lower.includes("3-5 per week") ||
    lower.includes("3-4 per week") ||
    lower.includes("3-5 posts/week") ||
    lower.includes("3-4 posts per week") ||
    lower.includes("3-5 reels") ||
    lower.match(/[3-5]-[3-5] (posts|reels|videos) (per|a) week/) ||
    ch === "linkedin" ||                      // LinkedIn explicitly: "3-4 posts per week maximum"
    ch === "reddit"                           // Reddit: "3-5 posts per week total"
  ) return 5;

  // ── Medium-frequency: 1-3 per week / weekly — 3 posts ────────────────────
  if (
    lower.includes("1-2") ||                 // Facebook Groups, Slack, WhatsApp: "1-2 posts per week"
    lower.includes("weekly") ||              // Substack: "Weekly is the standard"
    lower.includes("once a week") ||
    lower.includes("1 video/week") ||
    lower.includes("1 post/week") ||
    lower.includes("minimum 1 video/week") ||
    lower.includes("minimum 1/day")          // Discord min but weekly events
  ) return 3;

  // ── Quarterly / monthly — 1 post ─────────────────────────────────────────
  if (
    lower.includes("quarterly") ||
    lower.includes("monthly") ||
    lower.includes("one per month") ||
    lower.includes("once per month") ||
    lower.includes("per month")
  ) return 1;

  // ── Rare / low-frequency — 1 post ────────────────────────────────────────
  if (
    lower.includes("one shot") ||
    lower.includes("one excellent post") ||
    lower.includes("post rarely") ||
    lower.includes("rarely")
  ) return 1;

  // Default: 3 posts (safe middle ground)
  return 3;
}

export function buildPostsCalendarUserPrompt(
  icp: ICPProfile,
  data: WizardFormData,
  channels: string[]
): string {
  const { loadPlatforms } = require("@/lib/platforms/loader") as { loadPlatforms: () => any[] };
  const platforms = loadPlatforms();

  // Build a cadence summary per platform for the user prompt context
  const cadenceSummary = channels.map((ch) => {
    const platform = platforms.find((p: any) => p.channel === ch);
    const cadence = platform?.algorithm_playbook?.optimal_posting_cadence || "daily";
    const count = getPostCountForPlatform(ch, cadence);
    return `${ch}: ${count} posts (cadence: ${cadence})`;
  }).join("\n");

  return `## PRODUCT
Name: ${data.productName}
URL: ${data.productUrl || "Not provided"}
Description: ${data.productDescription}
Problem it solves: ${data.problemItSolves || "Not specified"}
Pricing: ${data.pricingModel}${data.pricePoint ? ` at ${data.pricePoint}` : ""}
Goal: ${data.primaryGoal === "first-100" ? "Get first 100 users" : data.primaryGoal === "launch" ? "Product launch buzz" : "Scale existing growth"}
Timeline: ${data.timeline === "2-weeks" ? "2 weeks" : data.timeline === "1-month" ? "1 month" : "3 months"}

## ICP
Title: ${icp.title}
Summary: ${icp.summary}
Age: ${icp.demographics.ageRange} | Location: ${icp.demographics.location}
Job titles: ${icp.demographics.jobTitles.join(", ")}
Core pain points: ${icp.painPoints.slice(0, 3).join("; ")}
Buying triggers: ${icp.buyingTriggers.slice(0, 2).join("; ")}
DISC personality: ${icp.discProfile.primaryType}/${icp.discProfile.secondaryType}
How to communicate: ${icp.discProfile.communicationStyle}
Key frustrations: ${icp.psychographics.frustrations.slice(0, 2).join("; ")}

## MATCHED PLATFORMS AND POST COUNTS:
${cadenceSummary}

## TASK
Write the post calendar now. Every post MUST:
1. Sound like a real founder wrote it — specific, human, slightly informal
2. Be immediately ready to copy-paste and post with zero editing needed
3. Reference real details about ${data.productName} and this exact ICP
4. Use the exact hook formulas from the platform rules
5. Have zero placeholders, zero generic statements, zero corporate language

Do NOT write 7 posts per platform unless the cadence says so. Follow the post counts above exactly.`;
}
