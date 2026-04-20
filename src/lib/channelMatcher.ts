import type { ICPProfile } from "./types";

// ==========================================
// Channel Matching Matrix
// Deterministic scoring — no AI, no guesswork
// 10 channels total: 3 Tier 1 + 3 Tier 2 + top 4 of 8 launch platforms
// ==========================================

export interface ChannelScore {
  name: string;
  score: number;
  pushType: "hard" | "soft";
  bucket: "tier1" | "tier2" | "launch";
}

type ChannelRule = (icp: ICPProfile, industry: string, pricingModel: string) => number;

// ── Tier 1: Weekly organic posting (3 channels, always included) ────────────
const TIER1_RULES: Record<string, ChannelRule> = {
  Reddit: (icp, industry, pricing) => {
    let score = 60;
    if (icp.discProfile.primaryType === "C") score += 20;
    if (icp.discProfile.primaryType === "D") score += 10;
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("18") || ageRange.includes("25") || ageRange.includes("22")) score += 15;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("developer") || industryLower.includes("software")) score += 20;
    if (industryLower.includes("fintech") || industryLower.includes("productivity")) score += 10;
    if (industryLower.includes("fashion") || industryLower.includes("beauty") || industryLower.includes("food")) score -= 15;
    if (pricing === "free" || pricing === "freemium") score += 10;
    return Math.min(score, 100);
  },

  LinkedIn: (icp, industry) => {
    let score = 60;
    const income = icp.demographics.incomeRange;
    if (income.includes("80") || income.includes("100") || income.includes("120") || income.includes("150")) score += 20;
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("founder") || titles.includes("cto") || titles.includes("ceo") || titles.includes("manager") || titles.includes("director")) score += 25;
    if (titles.includes("engineer") || titles.includes("developer")) score += 10;
    if (icp.discProfile.primaryType === "I" || icp.discProfile.primaryType === "D") score += 15;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("b2b") || industryLower.includes("saas") || industryLower.includes("enterprise") || industryLower.includes("fintech")) score += 20;
    if (industryLower.includes("edtech") || industryLower.includes("hr") || industryLower.includes("recruiting")) score += 15;
    if (industryLower.includes("fashion") || industryLower.includes("gaming") || industryLower.includes("food")) score -= 20;
    return Math.min(score, 100);
  },

  "X (Twitter)": (icp, industry) => {
    let score = 55;
    if (icp.discProfile.primaryType === "D" || icp.discProfile.primaryType === "I") score += 20;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("startup") || industryLower.includes("crypto") || industryLower.includes("ai")) score += 20;
    if (industryLower.includes("media") || industryLower.includes("creator") || industryLower.includes("politics")) score += 15;
    if (industryLower.includes("b2b enterprise") || industryLower.includes("healthcare")) score -= 10;
    const interests = icp.psychographics.interests.join(" ").toLowerCase();
    if (interests.includes("tech") || interests.includes("startup") || interests.includes("investing") || interests.includes("politics")) score += 10;
    return Math.min(score, 100);
  },
};

// ── Tier 2: Weekly video content ideas (3 channels, always included) ────────
const TIER2_RULES: Record<string, ChannelRule> = {
  YouTube: (icp, industry) => {
    let score = 50;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("edtech") || industryLower.includes("education")) score += 30;
    if (industryLower.includes("fitness") || industryLower.includes("cooking") || industryLower.includes("diy")) score += 25;
    if (industryLower.includes("software") || industryLower.includes("developer")) score += 15;
    if (industryLower.includes("finance") || industryLower.includes("investing")) score += 20;
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("25") || ageRange.includes("30") || ageRange.includes("35")) score += 10;
    const interests = icp.psychographics.interests.join(" ").toLowerCase();
    if (interests.includes("learning") || interests.includes("tutorial") || interests.includes("how to")) score += 20;
    return Math.min(score, 100);
  },

  Instagram: (icp, industry) => {
    let score = 45;
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("18") || ageRange.includes("22") || ageRange.includes("25")) score += 20;
    if (icp.discProfile.primaryType === "I") score += 20;
    if (icp.discProfile.primaryType === "S") score += 10;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("fashion") || industryLower.includes("beauty") || industryLower.includes("lifestyle")) score += 30;
    if (industryLower.includes("food") || industryLower.includes("fitness") || industryLower.includes("travel")) score += 25;
    if (industryLower.includes("creator") || industryLower.includes("content")) score += 20;
    if (industryLower.includes("saas") || industryLower.includes("developer") || industryLower.includes("b2b")) score -= 20;
    const interests = icp.psychographics.interests.join(" ").toLowerCase();
    if (interests.includes("design") || interests.includes("aesthetic") || interests.includes("art")) score += 15;
    return Math.min(score, 100);
  },

  TikTok: (icp, industry) => {
    let score = 40;
    const ageRange = icp.demographics.ageRange;
    if (ageRange.includes("18") || ageRange.includes("22") || ageRange.includes("25")) score += 25;
    if (icp.discProfile.primaryType === "I") score += 20;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("fashion") || industryLower.includes("beauty") || industryLower.includes("food")) score += 25;
    if (industryLower.includes("fitness") || industryLower.includes("lifestyle") || industryLower.includes("consumer")) score += 20;
    if (industryLower.includes("creator") || industryLower.includes("content")) score += 20;
    if (industryLower.includes("b2b enterprise") || industryLower.includes("fintech")) score -= 15;
    return Math.min(score, 100);
  },
};

// ── Launch platforms: One-time launch posts (top 4 of 8 included) ───────────
const LAUNCH_RULES: Record<string, ChannelRule> = {
  "Product Hunt": (icp, industry, pricing) => {
    let score = 55;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("productivity") || industryLower.includes("ai")) score += 20;
    if (industryLower.includes("developer") || industryLower.includes("design")) score += 15;
    if (industryLower.includes("consumer") || industryLower.includes("app")) score += 10;
    if (pricing === "free" || pricing === "freemium") score += 20;
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("product") || titles.includes("designer") || titles.includes("founder") || titles.includes("marketer")) score += 15;
    return Math.min(score, 100);
  },

  "Hacker News": (icp, industry) => {
    let score = 30;
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("engineer") || titles.includes("developer") || titles.includes("cto") || titles.includes("founder")) score += 35;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("developer") || industryLower.includes("software") || industryLower.includes("open source")) score += 25;
    if (industryLower.includes("ai") || industryLower.includes("devtools") || industryLower.includes("infrastructure")) score += 20;
    if (industryLower.includes("fashion") || industryLower.includes("food") || industryLower.includes("fitness")) score -= 30;
    if (icp.discProfile.primaryType === "C") score += 15;
    return Math.min(score, 100);
  },

  "Indie Hackers": (icp, industry, pricing) => {
    let score = 50;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("indie") || industryLower.includes("startup")) score += 25;
    if (industryLower.includes("solo") || industryLower.includes("bootstrapped")) score += 15;
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("founder") || titles.includes("maker") || titles.includes("indie")) score += 20;
    if (pricing === "paid" || pricing === "freemium") score += 10;
    return Math.min(score, 100);
  },

  BetaList: (icp, industry) => {
    let score = 45;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("app") || industryLower.includes("tool")) score += 20;
    if (industryLower.includes("b2c") || industryLower.includes("consumer") || industryLower.includes("startup")) score += 15;
    return Math.min(score, 100);
  },

  "Dev.to": (icp, industry) => {
    let score = 35;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("developer") || industryLower.includes("devtool") || industryLower.includes("api")) score += 30;
    if (industryLower.includes("software") || industryLower.includes("infrastructure") || industryLower.includes("open source")) score += 20;
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("engineer") || titles.includes("developer")) score += 25;
    if (industryLower.includes("fashion") || industryLower.includes("food")) score -= 30;
    return Math.min(score, 100);
  },

  Uneed: (icp, industry, pricing) => {
    let score = 35;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("ai") || industryLower.includes("saas") || industryLower.includes("tool")) score += 15;
    if (pricing === "freemium" || pricing === "paid") score += 10;
    return Math.min(score, 100);
  },

  MicroLaunch: (icp, industry, pricing) => {
    let score = 30;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("saas") || industryLower.includes("indie")) score += 15;
    if (pricing === "free" || pricing === "freemium") score += 10;
    return Math.min(score, 100);
  },

  "Medium / Hashnode": (icp, industry) => {
    let score = 35;
    const industryLower = industry.toLowerCase();
    if (industryLower.includes("developer") || industryLower.includes("software") || industryLower.includes("ai")) score += 20;
    if (industryLower.includes("fintech") || industryLower.includes("data")) score += 10;
    if (icp.discProfile.primaryType === "C") score += 15;
    const titles = icp.demographics.jobTitles.join(" ").toLowerCase();
    if (titles.includes("engineer") || titles.includes("developer") || titles.includes("writer")) score += 15;
    return Math.min(score, 100);
  },
};

export function matchChannels(
  icp: ICPProfile,
  industry: string,
  pricingModel: string
): ChannelScore[] {
  const scoreBucket = (rules: Record<string, ChannelRule>, bucket: ChannelScore["bucket"]) =>
    Object.entries(rules).map(([name, rule]): ChannelScore => ({
      name,
      score: rule(icp, industry, pricingModel),
      pushType: "soft",
      bucket,
    }));

  const tier1 = scoreBucket(TIER1_RULES, "tier1");
  const tier2 = scoreBucket(TIER2_RULES, "tier2");
  const launchAll = scoreBucket(LAUNCH_RULES, "launch");
  const launchTop4 = launchAll.sort((a, b) => b.score - a.score).slice(0, 4);

  // Combine, then rank all 10 by score
  const combined = [...tier1, ...tier2, ...launchTop4].sort((a, b) => b.score - a.score);

  // Top 3 overall = hard push; remainder = soft
  combined.forEach((c, i) => { c.pushType = i < 3 ? "hard" : "soft"; });

  return combined;
}
