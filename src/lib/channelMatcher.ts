import type { ICPProfile } from "./types";
import { loadPlatforms, type Platform } from "./platforms/loader";

export interface ChannelScore {
  name: string;
  score: number;
  pushType: "hard" | "soft";
}

// ==========================================
// Genuine fit scoring — every factor maps to a real
// signal in the platform's JSON data.
// Score is always 0–100, never random.
// ==========================================
function calculatePlatformScore(
  platform: Platform,
  icp: ICPProfile,
  industry: string,
  pricingModel: string
): number {
  const fit = platform.fit_scoring_matrix;
  const dna = platform.channel_dna;
  const growth = platform.growth_mechanics;

  // ── Base from tier (Tier 1 = 40pts, Tier 5 = 0pts) ──────────────────────
  // Tier 1 platforms are broad, high-reach, and almost always relevant.
  // Tier 5 are specialised and only score highly for exact-fit products.
  let score = Math.max(0, (6 - platform.tier) * 8); // 40 / 32 / 24 / 16 / 8

  const industryLower = industry.toLowerCase();
  const pricingLower = pricingModel.toLowerCase();
  const jobTitles = icp.demographics.jobTitles.join(" ").toLowerCase();
  const interests = icp.psychographics.interests.join(" ").toLowerCase();
  const ageRange = icp.demographics.ageRange.toLowerCase();
  const icpLocation = icp.demographics.location.toLowerCase();

  const bestTypes = fit.best_product_types.toLowerCase();
  const worstTypes = fit.worst_product_types.toLowerCase();
  const bestPricing = fit.best_pricing_models.toLowerCase();
  const icpSignals = fit.icp_match_signals.toLowerCase();
  const redFlags = fit.red_flags_skip_this_channel.toLowerCase();
  const geoStrength = fit.geographic_strength.toLowerCase();
  const audience = dna.primary_audience.toLowerCase();

  // ── 1. Product type match (+20 / -20) ────────────────────────────────────
  // Check if any word from the industry description appears in best_product_types
  const industryWords = industryLower.split(/[\s,]+/).filter(w => w.length > 3);
  const bestTypeWords = bestTypes.split(/[\s,]+/).filter(w => w.length > 3);
  const hasProductMatch = industryWords.some(w => bestTypes.includes(w)) ||
    bestTypeWords.some(w => industryLower.includes(w));
  if (hasProductMatch) score += 20;

  const worstTypeWords = worstTypes.split(/[\s,]+/).filter(w => w.length > 3);
  const hasProductMismatch = industryWords.some(w => worstTypes.includes(w)) ||
    worstTypeWords.some(w => industryLower.includes(w));
  if (hasProductMismatch) score -= 20;

  // ── 2. Pricing model fit (+12) ────────────────────────────────────────────
  if (bestPricing.includes(pricingLower)) score += 12;
  // "all models work" is a strong positive signal
  if (bestPricing.includes("all") || bestPricing.includes("all pricing") || bestPricing.includes("all models")) score += 8;

  // ── 3. ICP audience age match (+10) ──────────────────────────────────────
  const ageNum = parseInt(ageRange.split(/[-–]/)[0] || "30", 10);
  if (audience.includes("18-30") && ageNum >= 18 && ageNum <= 30) score += 10;
  else if (audience.includes("18-35") && ageNum >= 18 && ageNum <= 35) score += 10;
  else if (audience.includes("25-45") && ageNum >= 25 && ageNum <= 45) score += 10;
  else if (audience.includes("25-55") && ageNum >= 25 && ageNum <= 55) score += 10;
  else if (audience.includes("35-55") && ageNum >= 35 && ageNum <= 55) score += 10;

  // ── 4. ICP job title / role signals (+12) ────────────────────────────────
  const icpSignalWords = icpSignals.split(/[\s,]+/).filter(w => w.length > 4);
  const jobTitleWords = jobTitles.split(/[\s,]+/).filter(w => w.length > 3);
  const hasRoleMatch = jobTitleWords.some(w => icpSignals.includes(w)) ||
    icpSignalWords.some(w => jobTitles.includes(w));
  if (hasRoleMatch) score += 12;

  // Specific strong role signals
  if (icpSignals.includes("founder") && jobTitles.includes("founder")) score += 8;
  if (icpSignals.includes("developer") && (jobTitles.includes("engineer") || jobTitles.includes("developer"))) score += 8;
  if (icpSignals.includes("marketer") && (jobTitles.includes("marketing") || jobTitles.includes("growth"))) score += 8;
  if (icpSignals.includes("designer") && jobTitles.includes("design")) score += 8;
  if (icpSignals.includes("student") && jobTitles.includes("student")) score += 8;

  // ── 5. ICP interest alignment (+8) ───────────────────────────────────────
  const interestWords = interests.split(/[\s,]+/).filter(w => w.length > 4);
  const hasInterestMatch = interestWords.some(w => audience.includes(w) || icpSignals.includes(w));
  if (hasInterestMatch) score += 8;

  // ── 6. Geographic strength match (+8) ────────────────────────────────────
  // If the ICP's main location overlaps with platform geo strength
  const locationWords = icpLocation.split(/[\s,()%]+/).filter(w => w.length > 2 && isNaN(Number(w)));
  const hasGeoMatch = locationWords.some(w => geoStrength.includes(w.toLowerCase()));
  if (hasGeoMatch) score += 8;

  // ── 7. DISC profile fit (+6) ──────────────────────────────────────────────
  const discType = icp.discProfile.primaryType;
  const discDesc = icp.discProfile.description.toLowerCase();
  if (discType === "C" && (audience.includes("analytical") || audience.includes("technical") || audience.includes("engineer"))) score += 6;
  if (discType === "I" && (audience.includes("social") || audience.includes("creator") || audience.includes("influencer"))) score += 6;
  if (discType === "D" && (audience.includes("founder") || audience.includes("decision") || audience.includes("executive"))) score += 6;
  if (discType === "S" && (audience.includes("community") || audience.includes("support") || audience.includes("professional"))) score += 6;

  // ── 8. Growth mechanics quality bonus (+6) ────────────────────────────────
  // Platforms where CAC is $0 and time to ROI is fast get a bonus
  const cac = growth.expected_cac.toLowerCase();
  const timeToRoi = growth.time_to_first_paying_user.toLowerCase();
  if (cac.includes("$0")) score += 4;
  if (timeToRoi.includes("week") || timeToRoi.includes("days")) score += 4;

  // ── 9. Red flag penalties ─────────────────────────────────────────────────
  // Apply hard penalties for explicit mismatches
  if (redFlags.includes("under 25") && ageNum < 25) score -= 18;
  if (redFlags.includes("non-technical") && !jobTitles.includes("engineer") && !jobTitles.includes("developer")) score -= 12;
  if (redFlags.includes("enterprise") && industryLower.includes("enterprise")) score -= 12;
  if (redFlags.includes("no visual") && !bestTypes.includes("visual")) {
    // Only penalise if it's a visual platform (Instagram, TikTok) and product has no visual
    if (platform.channel === "Instagram" || platform.channel === "TikTok") score -= 15;
  }
  if (redFlags.includes("no open source") && platform.channel === "GitHub" && !industryLower.includes("open")) score -= 15;
  if (redFlags.includes("45+") && ageNum > 45 && (platform.channel === "TikTok" || platform.channel === "Instagram")) score -= 20;
  if (redFlags.includes("offline") && (platform.channel === "Shopify App Store" && !industryLower.includes("shopify") && !industryLower.includes("ecommerce"))) score -= 25;

  // ── Clamp to 0–100 ────────────────────────────────────────────────────────
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function matchChannels(
  icp: ICPProfile,
  industry: string,
  pricingModel: string
): ChannelScore[] {
  const platforms = loadPlatforms();

  const scores: ChannelScore[] = platforms.map((platform) => ({
    name: platform.channel,
    score: calculatePlatformScore(platform, icp, industry, pricingModel),
    pushType: "soft" as const,
  }));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return ALL channels with score > 50 (user requirement)
  // Minimum 3 channels guaranteed
  let qualified = scores.filter((s) => s.score > 50);
  if (qualified.length < 3) {
    qualified = scores.slice(0, 3);
  }

  // Top 3 = hard push, rest = soft push
  qualified.forEach((channel, index) => {
    channel.pushType = index < 3 ? "hard" : "soft";
  });

  return qualified;
}
