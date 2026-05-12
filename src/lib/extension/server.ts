import { createHash } from "node:crypto";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

type ConnectedHandles = {
  twitter?: string;
  reddit?: string;
  linkedin?: string;
};

type Platform = "twitter_x" | "reddit" | "linkedin";

type JsonObject = Record<string, unknown>;

type ActivePlaybook = {
  playbook_id: string;
  product_name: string;
  recommended_subreddits: string[];
  intent_keywords: string[];
  icp_summary: string;
  icp_job_titles: string[];
};

type ExtensionConfigRecord = {
  connected_handles?: ConnectedHandles | null;
  selectors?: Record<string, unknown> | null;
  last_synced_at?: string | null;
};

type PlaybookRecord = {
  id: string;
  product_name?: string | null;
  created_at?: string | null;
  data?: JsonObject | null;
};

type IntentLeadInput = {
  username_or_name: string;
  bio_or_headline?: string;
  profile_url: string;
  matched_text_preview?: string;
  matched_keyword?: string;
  source_url?: string;
  posted_at?: string;
  page_context?: string;
  engagement_weight?: number;
};

export function getExtensionCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function createExtensionSupabaseClient(request: NextRequest) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(keysToSet) {
          try {
            keysToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // noop in route handlers that do not need to persist cookies
          }
        },
      },
      global: {
        headers: request.headers.get("authorization")
          ? { Authorization: request.headers.get("authorization") as string }
          : {},
      },
    }
  );
}

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export async function getAuthenticatedExtensionUser(request: NextRequest) {
  const supabase = await createExtensionSupabaseClient(request);
  const bearerToken = getBearerToken(request);
  const { data, error } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      supabase,
      user: null,
      error: error?.message ?? "Unauthorized",
    };
  }

  return {
    supabase,
    user: data.user,
    error: null,
  };
}

export function buildExtensionConfigResponse(params: {
  userId: string;
  config: ExtensionConfigRecord | null;
  playbooks: PlaybookRecord[] | null;
}) {
  const config = params.config;
  const playbooks = params.playbooks ?? [];

  return {
    farcastUserId: params.userId,
    connectedHandles: normalizeConnectedHandles(config?.connected_handles),
    activePlaybooks: playbooks.map(toActivePlaybook),
    selectors: normalizeSelectors(config?.selectors),
    syncedAt:
      config?.last_synced_at ?? new Date().toISOString(),
  };
}

export function buildIntentLeadFingerprint(input: {
  platform: Platform;
  profileUrl: string;
  usernameOrName: string;
  matchedKeyword: string;
}) {
  const identity = normalizeFingerprintValue(input.profileUrl || input.usernameOrName);
  const keyword = normalizeFingerprintValue(input.matchedKeyword);

  return createHash("sha256")
    .update(`${input.platform}:${identity}:${keyword}`)
    .digest("hex");
}

export function sanitizeIntentLead(input: IntentLeadInput) {
  return {
    username_or_name: input.username_or_name?.trim() ?? "",
    bio_or_headline: input.bio_or_headline?.trim() || null,
    profile_url: input.profile_url?.trim() ?? "",
    matched_text_preview: input.matched_text_preview?.trim() || null,
    matched_keyword: input.matched_keyword?.trim() ?? "",
    source_url: input.source_url?.trim() ?? "",
    posted_at: input.posted_at?.trim() || null,
    page_context: input.page_context?.trim() || null,
    engagement_weight:
      typeof input.engagement_weight === "number" && input.engagement_weight > 0
        ? Math.floor(input.engagement_weight)
        : 0,
  };
}

const HIGH_INTENT_PATTERNS: RegExp[] = [
  /\blooking for\b/i,
  /\bany (?:good\s+)?(?:tool|software|app|platform|solution|recommendation)s?\b/i,
  /\brecommend(?:ation)?s?\b/i,
  /\bbest (?:tool|way|option|alternative|solution)\b/i,
  /\balternative to\b/i,
  /\breplace\b/i,
  /\bswitch(?:ing)? (?:from|away)\b/i,
  /\bwhat (?:do|should|would) (?:you|we|i) use\b/i,
  /\bany suggestions?\b/i,
  /\bhelp me find\b/i,
  /\bis there (?:a|any)\b/i,
  /\bdoes anyone (?:know|use|recommend)\b/i,
];

const MEDIUM_INTENT_PATTERNS: RegExp[] = [
  /\bstruggl(?:e|ing|ed)\b/i,
  /\bmanual(?:ly)?\b/i,
  /\btoo (?:slow|expensive|hard|complex|complicated)\b/i,
  /\btime[- ]consuming\b/i,
  /\bfrustrat(?:e|ed|ing)\b/i,
  /\bpainful\b/i,
  /\bbroken\b/i,
  /\bissue with\b/i,
  /\bproblem with\b/i,
  /\bcan'?t figure\b/i,
  /\boverwhel(?:m|med|ming)\b/i,
  /\bnightmare\b/i,
  /\bwaste (?:of )?time\b/i,
  /\btired of\b/i,
  /\bsick of\b/i,
];

// Bio signals that indicate a non-buyer: job seekers, students, agencies selling services
const NEGATIVE_BIO_PATTERNS: RegExp[] = [
  /\b(?:hiring|we'?re hiring|now hiring|join our team)\b/i,
  /\b(?:open to (?:work|opportunities)|seeking (?:new )?(?:role|position|opportunity)|job seeker)\b/i,
  /\b(?:looking for (?:a )?(?:job|role|position|internship))\b/i,
  /\b(?:cs|software|computer science|engineering)\s+student\b/i,
  /\b(?:undergrad|undergraduate|grad student|phd(?:\s+student)?|msc student|masters student)\b/i,
  /\b(?:learning to (?:code|program)|new to coding|just started coding|aspiring developer)\b/i,
  /\b(?:i teach|online course|course creator|e-?learning|instructor|professor|lecturer)\b/i,
  /\b(?:(?:digital )?marketing agency|growth agency|seo agency|we help (?:businesses|companies|startups|brands)|services agency)\b/i,
  /\b(?:available for (?:hire|freelance)|freelance (?:available|services)|hire me)\b/i,
];

// Text signals that indicate the post is not from a real buyer
const NEGATIVE_TEXT_PATTERNS: RegExp[] = [
  /\b(?:we'?re hiring|looking to hire|job (?:opening|posting|opportunity)|apply now)\b/i,
  /\b(?:our agency (?:can|will|offers|helps)|dm (?:us|me) for (?:our )?services)\b/i,
];

// Post text signals that indicate the author is actively selling/promoting their own product
const SELLER_POST_PATTERNS: RegExp[] = [
  /\blink in (?:my |the )?bio\b/i,
  /\b(?:try|sign up|join|get started|get access)(?:\s+\w+){0,3}\s+for free\b/i,
  /\bdm (?:me|us) (?:for|to get|to try|for access|if you)\b/i,
  /\bcheck (?:out|it out|this out)\s+(?:my|our)\b/i,
  /\b(?:use|enter) (?:promo |discount |coupon )?code\b/i,
  /\bproduct hunt\b/i,
  /#launc(?:h|hed|hing)\b/i,
];

// Founder / operator patterns → highest ICP match
const FOUNDER_PATTERNS: RegExp[] = [
  /\b(?:founder|co-?founder|ceo|cto|coo|president|owner|solopreneur|solo ?founder|building)\b/i,
];

// Buyer-adjacent roles → good ICP match
const BUYER_ROLE_PATTERNS: RegExp[] = [
  /\b(?:marketer|marketing|growth hacker|demand gen|cmo|vp (?:of )?marketing|head of (?:growth|marketing))\b/i,
  /\b(?:product manager|pm|head of product|vp (?:of )?product)\b/i,
  /\b(?:developer|engineer|programmer|dev|software|backend|frontend|full.?stack)\b/i,
  /\b(?:entrepreneur|startup|bootstrapped|early.?stage|indiehacker|indie hacker)\b/i,
  /\b(?:operator|consultant|advisor|partner)\b/i,
];

export function isNegativeLead(
  bioOrHeadline: string | null | undefined,
  matchedText: string | null | undefined
): boolean {
  const bio = bioOrHeadline ?? "";
  const text = matchedText ?? "";
  if (bio && NEGATIVE_BIO_PATTERNS.some((p) => p.test(bio))) return true;
  if (text && NEGATIVE_TEXT_PATTERNS.some((p) => p.test(text))) return true;
  return false;
}

export function isSellerLead(matchedText: string | null | undefined): boolean {
  const text = matchedText ?? "";
  if (!text) return false;
  return SELLER_POST_PATTERNS.some((p) => p.test(text));
}

export function matchesIcpRoles(
  bioOrHeadline: string | null | undefined,
  jobTitles: string[]
): boolean {
  if (!jobTitles.length) return true;
  const bio = (bioOrHeadline ?? "").toLowerCase().trim();
  if (!bio) return true; // no bio available — give benefit of the doubt
  return jobTitles.some((title) => bio.includes(title.toLowerCase()));
}

export function classifyIntentLevel(text: string): "high" | "medium" | "low" {
  if (HIGH_INTENT_PATTERNS.some((p) => p.test(text))) return "high";
  if (MEDIUM_INTENT_PATTERNS.some((p) => p.test(text))) return "medium";
  return "low";
}

export function computeRecencyScore(postedAt: string | null | undefined): number {
  if (!postedAt) return 0;
  try {
    const ageHours = (Date.now() - new Date(postedAt).getTime()) / 3_600_000;
    if (isNaN(ageHours)) return 0;
    if (ageHours <= 24) return 15;
    if (ageHours <= 72) return 8;
    if (ageHours <= 168) return 3;
    return 0;
  } catch {
    return 0;
  }
}

export function computeContextScore(
  platform: Platform,
  pageContext: string | null | undefined,
  recommendedSubreddits: string[]
): number {
  if (platform === "reddit" && pageContext?.startsWith("r/")) {
    const subreddit = pageContext.toLowerCase();
    const isRecommended = recommendedSubreddits.some(
      (r) => r.toLowerCase() === subreddit || `r/${r.toLowerCase()}` === subreddit
    );
    return isRecommended ? 20 : 8;
  }
  return 5;
}

export function computeIcpBioScore(
  bioOrHeadline: string | null | undefined,
  icpSummary: string | null | undefined
): number {
  if (!bioOrHeadline) return 0;
  const bio = bioOrHeadline.toLowerCase();

  // Founders always score high — they're the primary buyer persona
  if (FOUNDER_PATTERNS.some((p) => p.test(bio))) {
    if (!icpSummary) return 12;
    const bioWords = new Set(bio.split(/\W+/).filter((w) => w.length > 3));
    const overlap = icpSummary
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && bioWords.has(w)).length;
    return overlap >= 1 ? 15 : 12;
  }

  // Buyer-adjacent roles — score based on ICP keyword overlap
  if (BUYER_ROLE_PATTERNS.some((p) => p.test(bio))) {
    if (!icpSummary) return 8;
    const bioWords = new Set(bio.split(/\W+/).filter((w) => w.length > 3));
    const overlap = icpSummary
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && bioWords.has(w)).length;
    return overlap >= 2 ? 15 : 8;
  }

  // Fallback: pure keyword overlap
  if (!icpSummary) return 0;
  const bioWords = new Set(bio.split(/\W+/).filter((w) => w.length > 3));
  const overlap = icpSummary
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && bioWords.has(w)).length;
  if (overlap >= 3) return 8;
  if (overlap >= 1) return 4;
  return 0;
}

// engagement_weight = reply/comment count detected in the DOM
export function computeEngagementScore(engagementWeight: number | null | undefined): number {
  if (!engagementWeight || engagementWeight <= 0) return 0;
  if (engagementWeight >= 5) return 10;
  if (engagementWeight >= 2) return 5;
  return 2;
}

// +20 for leads where the same user/keyword has been seen before
export function computeRepeatBoost(seenCount: number): number {
  return seenCount > 1 ? 20 : 0;
}

export function computeLeadScore(params: {
  intentLevel: "high" | "medium" | "low";
  recencyScore: number;
  contextScore: number;
  icpBioScore: number;
  engagementScore?: number;
  repeatBoost?: number;
}): number {
  const intentScore =
    params.intentLevel === "high" ? 50 : params.intentLevel === "medium" ? 25 : 5;
  return Math.min(
    100,
    intentScore +
      params.recencyScore +
      params.contextScore +
      params.icpBioScore +
      (params.engagementScore ?? 0) +
      (params.repeatBoost ?? 0)
  );
}

function normalizeConnectedHandles(handles?: ConnectedHandles | null): ConnectedHandles {
  if (!handles || typeof handles !== "object") {
    return {};
  }

  return {
    twitter: normalizeOptionalString(handles.twitter),
    reddit: normalizeOptionalString(handles.reddit),
    linkedin: normalizeOptionalString(handles.linkedin),
  };
}

function normalizeSelectors(selectors?: Record<string, unknown> | null) {
  if (!selectors || typeof selectors !== "object") {
    return {};
  }

  return selectors;
}

function toActivePlaybook(record: PlaybookRecord): ActivePlaybook {
  const data = asObject(record.data);
  const playbook = asObject(data.playbook);
  const formData = asObject(data.formData);
  const icp = asObject(playbook.icp);
  const demographics = asObject(icp.demographics);

  return {
    playbook_id: record.id,
    product_name:
      record.product_name?.trim() ||
      readString(playbook.productName) ||
      readString(formData.productName) ||
      "Untitled Playbook",
    recommended_subreddits: extractRecommendedSubreddits(data),
    intent_keywords: extractIntentKeywords(data),
    icp_summary:
      readString(icp.summary) ||
      readString(playbook.summary) ||
      readString(formData.targetAudience) ||
      "",
    icp_job_titles: toStringArray(demographics.jobTitles),
  };
}

function extractRecommendedSubreddits(value: unknown) {
  const matches = JSON.stringify(value ?? {}).match(/r\/[A-Za-z0-9_]+/g) ?? [];
  return uniqueStrings(matches.map((item) => item.trim()));
}

function extractIntentKeywords(value: unknown) {
  const root = asObject(value);
  const nestedData = asObject(root.data);
  const playbook = asObject(root.playbook);
  const formData = asObject(root.formData);
  const icp = asObject(playbook.icp);

  const explicit = [
    ...toStringArray(root.intent_keywords),
    ...toStringArray(nestedData.intent_keywords),
    ...toStringArray(playbook.intent_keywords),
  ]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  if (explicit.length > 0) {
    return uniqueStrings(explicit);
  }

  const candidates = [
    readString(formData.problemItSolves),
    readString(formData.productDescription),
    readString(formData.targetAudience),
    readString(icp.summary),
    ...toStringArray(icp.painPoints),
  ]
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .flatMap((item) =>
      item
        .split(/[\n,.;]|\b(?:and|or)\b/gi)
        .map((part) => part.trim().toLowerCase())
        .filter((part) => part.length >= 4)
    );

  return uniqueStrings(candidates).slice(0, 25);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeFingerprintValue(value: string) {
  return value.trim().toLowerCase();
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}