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
// Step 5: 7-Day Ready-to-Post Calendar Prompt
// ==========================================
export function buildPostsCalendarSystemPrompt(channels: string[]): string {
  const platformRules: Record<string, string> = {
    Reddit: `REDDIT RULES:
- Must feel like a genuine community member, NOT a founder pitching
- Titles must be questions, confessions, or stories (not announcements)
- No hashtags. No links in first comment unless it flows naturally.
- Best performing formats: "I built X because Y frustrated me", "Show HN"-style, "Unpopular opinion:", "Honest question:"
- Keep titles under 120 chars. Body can be longer (200-500 words tells a story well).
- Mention the subreddit context naturally but don't force it.`,
    LinkedIn: `LINKEDIN RULES:
- Hook must be 1 punchy line that stops scroll. No leading with "I" as first word.
- Use single-sentence paragraphs. White space is engagement.
- Structure: Hook > Story/Insight > Takeaway > Call to action (subtle).
- End with 1-3 relevant hashtags max. Never more.
- Optimal length: 150-300 words. Long form (500+) works for personal stories.
- "I almost quit" or counter-intuitive insights perform extremely well.`,
    "X": `X (TWITTER) RULES:
- Opening tweet must work as a standalone. Under 280 chars.
- For threads: First tweet is the hook. Each tweet adds ONE idea. End with CTA.
- Use numbers: "7 things I learned" or "$0 to $1K in 3 weeks"
- Contrarian takes and behind-the-scenes content drives retweets.
- No corporate speak. Lower case is fine. Casual wins.
- Hashtags: max 2, only if highly relevant.`,
    "Twitter/X": `X (TWITTER) RULES:
- Opening tweet must work as a standalone. Under 280 chars.
- For threads: First tweet is the hook. Each tweet adds ONE idea. End with CTA.
- Use numbers: "7 things I learned" or "$0 to $1K in 3 weeks"
- Contrarian takes and behind-the-scenes content drives retweets.
- No corporate speak. Lower case is fine. Casual wins.
- Hashtags: max 2, only if highly relevant.`,
    "Product Hunt": `PRODUCT HUNT RULES:
- First comment is crucial — it should tell the full story of WHY you built this.
- Tagline must be under 60 chars. No jargon.
- Ask for honest feedback, not upvotes.`,
  };

  const channelRules = channels
    .map((ch) => platformRules[ch] || `${ch.toUpperCase()} RULES:\n- Write natively for this platform. Authentic, specific, platform-appropriate tone.`)
    .join("\n\n");

  return `You are GetFarcast AI — the world's sharpest distribution strategist. Your ONLY job right now is to write a 7-day post calendar where EVERY single post is ready to copy-paste and publish TODAY.

## THE PLATFORMS YOU ARE WRITING FOR:
${channels.join(", ")}

## PLATFORM-SPECIFIC RULES (follow these to the letter):
${channelRules}

${ANTI_SLOP_RULES}

## CONTENT PILLAR ROTATION (use variety across the 7 days):
- Day 1: Origin Story — Why did the founder build this? What broke that made them snap?
- Day 2: The Problem — Make the ICP feel deeply seen. Describe their pain without mentioning the product.
- Day 3: Behind the Scenes — One real, specific insight from building this. Numbers, struggles, surprises.
- Day 4: Value-Add / Educational — Teach them something useful related to the problem. No product pitch.
- Day 5: Hot Take / Contrarian — A bold opinion that will get replies. Must be defensible and specific.  
- Day 6: Soft Pitch — The product reveal. Lead with transformation, not features.
- Day 7: Community / Engagement — Ask the ICP a question they actually want to answer.

## OUTPUT RULES:
1. Return ONLY valid JSON. Zero text outside the JSON block.
2. For EVERY single platform listed above, generate a full 7-day post sequence (Days 1 through 7). If there are 3 platforms, your JSON array MUST contain 21 posts (7 for each platform).
3. The "hook" field is the FIRST LINE ONLY. It must stop a scroll.
4. The "body" field is the FULL POST including the hook at the start. It must be copy-paste ready with NO placeholders. Substitute your own specific, plausible examples if needed.
5. "characterCount" must be the actual character count of the body field.
6. "bestTimeToPost" — give the optimal day+time for this specific platform.
7. "subredditOrHashtags" — for Reddit: specific subreddit (e.g., "r/SaaS, r/Entrepreneur"). For LinkedIn/X: 2-3 hashtags max. For others: leave empty string.

## JSON SCHEMA:
{
  "weekOf": "Week 1 — Launch Sprint",
  "posts": [
    {
      "day": 1,
      "platform": "Reddit",
      "postType": "Origin Story",
      "hook": "The exact first line that stops the scroll",
      "body": "Full ready-to-post text including the hook. Specific. Human. No filler.",
      "characterCount": 420,
      "bestTimeToPost": "Tuesday 9-11am EST",
      "subredditOrHashtags": "r/SaaS, r/Entrepreneur"
    }
  ]
}`;
}

export function buildPostsCalendarUserPrompt(
  icp: ICPProfile,
  data: WizardFormData,
  channels: string[]
): string {
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

## MATCHED PLATFORMS (write posts for THESE ONLY, rotate across them):
${channels.join(", ")}

## TASK
Write the 7-day post calendar now. Every post must be SPECIFIC to ${data.productName} and this ICP. Replace any placeholder with real, specific content that is ready to post today. No generic content. No filler. No slop.`;
}
