import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const nonEmptyStringArray = z.array(nonEmptyString).min(1);
const feedbackRatingSchema = z.enum(["fire", "ok", "flop"]);

export const WizardFormDataSchema = z
  .object({
    previousPlaybookId: nonEmptyString.optional(),
    productName: nonEmptyString,
    productUrl: z.string().trim(),
    productDescription: nonEmptyString,
    problemItSolves: z.string().trim(),
    targetAudience: z.string().trim(),
    industry: z.string().trim(),
    pricingModel: z.enum(["free", "freemium", "paid"]),
    pricePoint: z.string().trim(),
    primaryGoal: z.enum(["first-100", "launch", "scale"]),
    timeline: z.enum(["2-weeks", "1-month", "3-months"]),
  })
  .strict();

export const ICPProfileSchema = z
  .object({
    title: nonEmptyString,
    summary: nonEmptyString,
    demographics: z
      .object({
        ageRange: nonEmptyString,
        gender: nonEmptyString,
        location: nonEmptyString,
        incomeRange: nonEmptyString,
        education: nonEmptyString,
        jobTitles: nonEmptyStringArray,
      })
      .strict(),
    psychographics: z
      .object({
        personalityTraits: nonEmptyStringArray,
        values: nonEmptyStringArray,
        interests: nonEmptyStringArray,
        frustrations: nonEmptyStringArray,
        spendingHabits: nonEmptyStringArray,
      })
      .strict(),
    discProfile: z
      .object({
        primaryType: z.enum(["D", "I", "S", "C"]),
        secondaryType: z.enum(["D", "I", "S", "C"]),
        description: nonEmptyString,
        communicationStyle: nonEmptyString,
        motivators: nonEmptyStringArray,
        stressors: nonEmptyStringArray,
      })
      .strict(),
    buyingTriggers: nonEmptyStringArray,
    painPoints: nonEmptyStringArray,
    currentAlternatives: z
      .array(
        z
          .object({
            name: nonEmptyString,
            weakness: nonEmptyString,
          })
          .strict()
      )
      .min(1),
  })
  .strict();

export const MarketSizingSchema = z
  .object({
    tam: nonEmptyString,
    sam: nonEmptyString,
    som: nonEmptyString,
    trendDirection: z.enum(["growing", "stable", "declining"]),
    trendRationale: nonEmptyString,
  })
  .strict();

export const CalendarPostSchema = z
  .object({
    day: z.coerce.number().int().min(1),
    type: nonEmptyString,
    title: nonEmptyString,
    hook: nonEmptyString,
    body: nonEmptyString,
    feedbackRating: feedbackRatingSchema.optional(),
    feedbackComments: z.string().trim().optional(),
  })
  .strict();

export const ReadyPostSchema = z
  .object({
    day: z.coerce.number().int().min(1).max(7),
    platform: nonEmptyString,
    postType: nonEmptyString,
    hook: nonEmptyString,
    body: nonEmptyString,
    characterCount: z.coerce.number().int().nonnegative(),
    bestTimeToPost: nonEmptyString,
    subredditOrHashtags: z.string().default(""),
    feedbackRating: feedbackRatingSchema.optional(),
    feedbackComments: z.string().trim().optional(),
  })
  .strict();

export const PostsCalendarSchema = z
  .object({
    weekOf: nonEmptyString,
    weekNumber: z.coerce.number().int().min(1),
    generatedAt: nonEmptyString,
    posts: z.array(ReadyPostSchema).min(1),
  })
  .strict();

const InfluencerTargetSchema = z
  .object({
    handle: nonEmptyString,
    platform: nonEmptyString,
    audienceSize: nonEmptyString,
    why: nonEmptyString,
  })
  .strict();

export const ChannelStrategyLLMSchema = z
  .object({
    name: nonEmptyString,
    rationale: nonEmptyString,
    audienceSize: nonEmptyString,
    engagementRate: nonEmptyString,
    accessibility: z.enum(["free", "freemium", "paid"]),
    cac: nonEmptyString.optional(),
    timeToRoi: nonEmptyString.optional(),
    bestPostingTimes: z.array(nonEmptyString).default([]),
    algorithmInsights: nonEmptyStringArray,
    bestPractices: nonEmptyStringArray,
    antiPatterns: nonEmptyStringArray,
    influencerTargets: z.array(InfluencerTargetSchema).optional().default([]),
  })
  .strict();

export const ChannelStrategySchema = ChannelStrategyLLMSchema.extend({
  rank: z.coerce.number().int().min(1),
  fitScore: z.coerce.number().min(0).max(100),
  pushType: z.enum(["hard", "soft"]),
  contentCalendar: z.array(CalendarPostSchema).default([]),
}).strict();

export const EmailStepSchema = z
  .object({
    day: z.coerce.number().int().min(1),
    subject: nonEmptyString,
    body: nonEmptyString,
    purpose: nonEmptyString,
  })
  .strict();

export const DMTemplateSchema = z
  .object({
    platform: nonEmptyString,
    message: nonEmptyString,
    context: nonEmptyString,
  })
  .strict();

export const OutreachSequenceSchema = z
  .object({
    emailSequence: z.array(EmailStepSchema).min(1),
    dmTemplates: z.array(DMTemplateSchema).min(1),
  })
  .strict();

export const PlaybookSchema = z
  .object({
    id: nonEmptyString,
    createdAt: nonEmptyString,
    productName: nonEmptyString,
    summary: nonEmptyString,
    icp: ICPProfileSchema,
    marketSizing: MarketSizingSchema,
    channels: z.array(ChannelStrategySchema).min(1),
    outreach: OutreachSequenceSchema,
    postsCalendar: z.array(PostsCalendarSchema).optional().default([]),
  })
  .strict();

export const StoredPlaybookSchema = z
  .object({
    playbook: PlaybookSchema,
    formData: WizardFormDataSchema,
  })
  .strict();