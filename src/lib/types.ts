// ==========================================
// Shared types for GetFarcast
// ==========================================

// --- Wizard Form Data ---

export type PricingModel = "free" | "freemium" | "paid";
export type GoalType = "first-100" | "launch" | "scale";
export type Timeline = "2-weeks" | "1-month" | "3-months";

export interface WizardFormData {
  // Step 1: Product
  previousPlaybookId?: string;
  productName: string;
  productUrl: string;
  productDescription: string;
  problemItSolves: string;

  // Step 2: Audience
  targetAudience: string;
  industry: string;

  // Step 3: Pricing
  pricingModel: PricingModel;
  pricePoint: string;

  // Step 4: Goal
  primaryGoal: GoalType;
  timeline: Timeline;
}

// --- AI-Generated Playbook ---

export interface ICPDemographics {
  ageRange: string;
  gender: string;
  location: string;
  incomeRange: string;
  education: string;
  jobTitles: string[];
}

export interface ICPPsychographics {
  personalityTraits: string[];
  values: string[];
  interests: string[];
  frustrations: string[];
  spendingHabits: string[];
}

export interface DISCProfile {
  primaryType: "D" | "I" | "S" | "C";
  secondaryType: "D" | "I" | "S" | "C";
  description: string;
  communicationStyle: string;
  motivators: string[];
  stressors: string[];
}

export interface ICPProfile {
  title: string;
  summary: string;
  demographics: ICPDemographics;
  psychographics: ICPPsychographics;
  discProfile: DISCProfile;
  buyingTriggers: string[];
  painPoints: string[];
  currentAlternatives: { name: string; weakness: string }[];
}

export interface MarketSizing {
  tam: string;
  sam: string;
  som: string;
  trendDirection: "growing" | "stable" | "declining";
  trendRationale: string;
}

export interface CalendarPost {
  day: number;
  type: string;
  title: string;
  hook: string;
  body: string;
  feedbackRating?: "fire" | "ok" | "flop";
  feedbackComments?: string;
}

export interface ChannelStrategy {
  name: string;
  rank: number;
  fitScore: number;
  pushType: "hard" | "soft";
  rationale: string;
  audienceSize: string;
  engagementRate: string;
  accessibility: "free" | "freemium" | "paid";
  cac?: string;
  timeToRoi?: string;
  bestPostingTimes?: string[];
  algorithmInsights: string[];
  bestPractices: string[];
  antiPatterns: string[];
  contentCalendar: CalendarPost[];
}

export interface EmailStep {
  day: number;
  subject: string;
  body: string;
  purpose: string;
}

export interface DMTemplate {
  platform: string;
  message: string;
  context: string;
}

export interface OutreachSequence {
  emailSequence: EmailStep[];
  dmTemplates: DMTemplate[];
}

export interface Playbook {
  id: string;
  createdAt: string;
  productName: string;
  summary: string;
  icp: ICPProfile;
  marketSizing: MarketSizing;
  channels: ChannelStrategy[];
  outreach?: OutreachSequence;
}

// --- Growth Hacks ---

export interface GrowthHack {
  title: string;
  type: "online" | "offline";
  platform: string;
  where: string;
  description: string;
  steps: string[];
  effort: "low" | "medium" | "high";
  timeToFirstUser: string;
  expectedResult: string;
}

// --- Stored Playbook (localStorage) ---

export interface StoredPlaybook {
  playbook: Playbook;
  formData: WizardFormData;
}
