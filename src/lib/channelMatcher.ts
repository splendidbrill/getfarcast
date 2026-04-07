import type { ICPProfile } from "./types";
import { loadPlatforms, type Platform } from "./platforms/loader";

export interface ChannelScore {
  name: string;
  score: number;
  pushType: "hard" | "soft";
}

function calculatePlatformScore(platform: Platform, icp: ICPProfile, industry: string, pricingModel: string): number {
  const fit = platform.fit_scoring_matrix;
  let score = 50; // Base score

  // Tier bonus (higher tier = higher base score)
  score += (6 - platform.tier) * 10; // Tier 1 gets +50, Tier 5 gets +10

  // Product type fit
  const industryLower = industry.toLowerCase();
  const bestTypes = fit.best_product_types.toLowerCase();
  const worstTypes = fit.worst_product_types.toLowerCase();

  if (bestTypes.includes(industryLower) || industryLower.includes(bestTypes.split(',')[0]?.trim() || '')) {
    score += 25;
  }
  if (worstTypes.includes(industryLower) || industryLower.includes(worstTypes.split(',')[0]?.trim() || '')) {
    score -= 25;
  }

  // Pricing model fit
  const pricingLower = pricingModel.toLowerCase();
  const bestPricing = fit.best_pricing_models.toLowerCase();
  if (bestPricing.includes(pricingLower) || pricingLower.includes(bestPricing.split(',')[0]?.trim() || '')) {
    score += 15;
  }

  // ICP signals
  const icpSignals = fit.icp_match_signals.toLowerCase();
  const jobTitles = icp.demographics.jobTitles.join(' ').toLowerCase();
  const interests = icp.psychographics.interests.join(' ').toLowerCase();

  if (icpSignals.includes('job title') && jobTitles.includes('founder') ||
      icpSignals.includes('developer') && jobTitles.includes('developer') ||
      icpSignals.includes('professional') && (jobTitles.includes('manager') || jobTitles.includes('director'))) {
    score += 15;
  }

  // Age fit from primary audience
  const audience = platform.channel_dna.primary_audience.toLowerCase();
  const ageRange = icp.demographics.ageRange.toLowerCase();
  if (audience.includes('18-35') && ageRange.includes('18') ||
      audience.includes('25-45') && ageRange.includes('25') ||
      audience.includes('35-55') && ageRange.includes('35')) {
    score += 10;
  }

  // DISC profile fit
  const discType = icp.discProfile.primaryType;
  if (audience.includes('analytical') && discType === 'C') score += 10;
  if (audience.includes('dominant') && discType === 'D') score += 10;
  if (audience.includes('social') && discType === 'I') score += 10;
  if (audience.includes('steady') && discType === 'S') score += 10;

  // Red flags check
  const redFlags = fit.red_flags_skip_this_channel.toLowerCase();
  if (redFlags.includes('under 25') && ageRange.includes('18')) score -= 20;
  if (redFlags.includes('non-technical') && !jobTitles.includes('engineer')) score -= 15;
  if (redFlags.includes('enterprise') && industryLower.includes('b2b')) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function matchChannels(
  icp: ICPProfile,
  industry: string,
  pricingModel: string
): ChannelScore[] {
  const platforms = loadPlatforms();

  const scores: ChannelScore[] = platforms.map(platform => ({
    name: platform.channel,
    score: calculatePlatformScore(platform, icp, industry, pricingModel),
    pushType: "soft" as const,
  }));

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Top 3 = hard push, next 2 = soft push (or more if scores are high)
  const topChannels = scores.filter(s => s.score > 30).slice(0, 5);
  if (topChannels.length < 3) {
    // Ensure at least 3 channels for minimum variety
    const additional = scores.filter(s => !topChannels.find(tc => tc.name === s.name)).slice(0, 3 - topChannels.length);
    topChannels.push(...additional);
  }

  topChannels.forEach((channel, index) => {
    if (index < 3) channel.pushType = "hard";
    else channel.pushType = "soft";
  });

  return topChannels;
}
