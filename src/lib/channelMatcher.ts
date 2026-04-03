import type { ICPProfile } from "./types";

// ==========================================
// Channel Matching Matrix
// Deterministic scoring — no AI, no guesswork
// Each rule is based on researched ICP-to-channel fit data
// ==========================================

export interface ChannelScore {
  name: string;
  score: number;
  pushType: "hard" | "soft";
}

type ChannelRule = (icp: ICPProfile, industry: string, pricingModel: string) => number;

const CHANNEL_RULES: Record<string, ChannelRule> = {
  Reddit: (icp, industry, pricing) => {
    let score = 50; // Base score

    // DISC: C (analytical) and D (dominant) types love Reddit debate culture
    if (icp.discProfile.primaryType === "C") score += 20;
    if (icp.discProfile.primaryType === "D") score += 10;

    // Age: Reddit skews 18-35
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("18") || ageRange.includes("25") || ageRange.includes("22")) score += 15;

    // Industry fit
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("developer") || industryLower.includes("software")) score += 20;
    if (industryLower.includes("fintech") || industryLower.includes("productivity")) score += 10;
    if (industryLower.includes("fashion") || industryLower.includes("beauty") || industryLower.includes("food")) score -= 15;

    // Pricing: Reddit loves free tools
    if (pricing === "free" || pricing === "freemium") score += 10;

    return Math.min(score, 100);
  },

  LinkedIn: (icp, industry, pricing) => {
    let score = 50;

    // Income: LinkedIn is for professionals with spending power
    const income = icp.demographics.incomeRange;
    if (income.includes("80") || income.includes("100") || income.includes("120") || income.includes("150")) score += 20;

    // Job titles: B2B signals
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("founder") || titles.includes("cto") || titles.includes("ceo") || titles.includes("manager") || titles.includes("director")) score += 25;
    if (titles.includes("engineer") || titles.includes("developer")) score += 10;

    // DISC: I and D types are most active on LinkedIn
    if (icp.discProfile.primaryType === "I" || icp.discProfile.primaryType === "D") score += 15;

    // Industry fit
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("b2b") || industryLower.includes("saas") || industryLower.includes("enterprise") || industryLower.includes("fintech")) score += 20;
    if (industryLower.includes("edtech") || industryLower.includes("hr") || industryLower.includes("recruiting")) score += 15;
    if (industryLower.includes("fashion") || industryLower.includes("gaming") || industryLower.includes("food")) score -= 20;

    return Math.min(score, 100);
  },

  Instagram: (icp, industry) => {
    let score = 40;

    // Age: Instagram is strongest for 18-35
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("18") || ageRange.includes("22") || ageRange.includes("25")) score += 20;

    // DISC: I types (social, visual) dominate Instagram
    if (icp.discProfile.primaryType === "I") score += 20;
    if (icp.discProfile.primaryType === "S") score += 10;

    // Industry fit
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("fashion") || industryLower.includes("beauty") || industryLower.includes("lifestyle")) score += 30;
    if (industryLower.includes("food") || industryLower.includes("fitness") || industryLower.includes("travel")) score += 25;
    if (industryLower.includes("creator") || industryLower.includes("content")) score += 20;
    if (industryLower.includes("saas") || industryLower.includes("developer") || industryLower.includes("b2b")) score -= 20;

    // Psychographics
    const interests = icp.psychographics.interests.join(" ").toLowerCase();
    if (interests.includes("design") || interests.includes("aesthetic") || interests.includes("art")) score += 15;

    return Math.min(score, 100);
  },

  "Hacker News": (icp, industry) => {
    let score = 30;

    // Job titles: HN is for technical people
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("engineer") || titles.includes("developer") || titles.includes("cto") || titles.includes("founder")) score += 35;

    // Industry fit
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("developer") || industryLower.includes("software") || industryLower.includes("open source")) score += 25;
    if (industryLower.includes("ai") || industryLower.includes("devtools") || industryLower.includes("infrastructure")) score += 20;
    if (industryLower.includes("fashion") || industryLower.includes("food") || industryLower.includes("fitness")) score -= 30;

    // DISC: C types (analytical) dominate HN
    if (icp.discProfile.primaryType === "C") score += 15;

    return Math.min(score, 100);
  },

  "Product Hunt": (icp, industry, pricing) => {
    let score = 45;

    // PH loves new tools — any tech product benefits
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("productivity") || industryLower.includes("ai")) score += 20;
    if (industryLower.includes("developer") || industryLower.includes("design")) score += 15;

    // Freemium/free products do much better on PH
    if (pricing === "free" || pricing === "freemium") score += 20;

    // Job titles: early adopters/tech enthusiasts
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("product") || titles.includes("designer") || titles.includes("founder") || titles.includes("marketer")) score += 15;

    return Math.min(score, 100);
  },

  "X (Twitter)": (icp, industry) => {
    let score = 45;

    // DISC: D (dominant, opinionated) and I (social, expressive) thrive on X
    if (icp.discProfile.primaryType === "D" || icp.discProfile.primaryType === "I") score += 20;

    // Industry fit
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("startup") || industryLower.includes("crypto") || industryLower.includes("ai")) score += 20;
    if (industryLower.includes("media") || industryLower.includes("creator") || industryLower.includes("politics")) score += 15;
    if (industryLower.includes("b2b enterprise") || industryLower.includes("healthcare")) score -= 10;

    // Interests
    const interests = icp.psychographics.interests.join(" ").toLowerCase();
    if (interests.includes("tech") || interests.includes("startup") || interests.includes("investing") || interests.includes("politics")) score += 10;

    return Math.min(score, 100);
  },

  YouTube: (icp, industry) => {
    let score = 35;

    // Industry fit: tutorial-friendly industries
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("edtech") || industryLower.includes("education")) score += 30;
    if (industryLower.includes("fitness") || industryLower.includes("cooking") || industryLower.includes("diy")) score += 25;
    if (industryLower.includes("software") || industryLower.includes("developer")) score += 15;
    if (industryLower.includes("finance") || industryLower.includes("investing")) score += 20;

    // Age: YouTube is for all ages but strong for 18-45
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("25") || ageRange.includes("30") || ageRange.includes("35")) score += 10;

    // Interests
    const interests = icp.psychographics.interests.join(" ").toLowerCase();
    if (interests.includes("learning") || interests.includes("tutorial") || interests.includes("how to")) score += 20;

    return Math.min(score, 100);
  },
};

export function matchChannels(
  icp: ICPProfile,
  industry: string,
  pricingModel: string
): ChannelScore[] {
  const scores: ChannelScore[] = Object.entries(CHANNEL_RULES).map(
    ([channel, rule]) => ({
      name: channel,
      score: rule(icp, industry, pricingModel),
      pushType: "soft" as const,
    })
  );

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Top 3 = hard push, next 2 = soft push
  const top5 = scores.slice(0, 5);
  top5[0].pushType = "hard";
  top5[1].pushType = "hard";
  top5[2].pushType = "hard";
  if (top5[3]) top5[3].pushType = "soft";
  if (top5[4]) top5[4].pushType = "soft";

  return top5;
}
