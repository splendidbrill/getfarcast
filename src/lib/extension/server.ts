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
  };
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