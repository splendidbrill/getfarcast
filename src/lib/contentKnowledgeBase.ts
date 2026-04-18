import fs from "fs";
import path from "path";

// ==========================================
// Content Knowledge Base
// Loads channel-specific JSON playbooks from json2/
// and extracts relevant sections for prompt injection
// ==========================================

const JSON2_BASE = path.join(process.cwd(), "json2");

const TIER1_FILE_MAP: Record<string, string> = {
  reddit: path.join(JSON2_BASE, "weekly content engine", "01_reddit_revised.json"),
  twitter: path.join(JSON2_BASE, "weekly content engine", "02_twitter_x_revised.json"),
  linkedin: path.join(JSON2_BASE, "weekly content engine", "03_linkedin_revised.json"),
};

const TIER2_FILE_MAP: Record<string, string> = {
  tiktok: path.join(JSON2_BASE, "weekly content ideas", "04_tiktok_revised.json"),
  instagram: path.join(JSON2_BASE, "weekly content ideas", "05_instagram_revised.json"),
  youtube: path.join(JSON2_BASE, "weekly content ideas", "06_youtube_revised.json"),
};

const LAUNCH_FILE = path.join(JSON2_BASE, "farcast_launch_posts_playbook.json");

function normalise(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("twitter") || n === "x" || n.includes("x.com")) return "twitter";
  if (n.includes("reddit")) return "reddit";
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("instagram")) return "instagram";
  if (n.includes("youtube")) return "youtube";
  if (n.includes("product hunt")) return "product_hunt";
  if (n.includes("hacker news") || n.includes("hackernews")) return "hacker_news";
  if (n.includes("indie hacker")) return "indie_hackers";
  if (n.includes("betalist")) return "betalist";
  if (n.includes("dev.to") || n.includes("devto")) return "devto";
  if (n.includes("uneed")) return "uneed";
  if (n.includes("microlaunch")) return "microlaunch";
  if (n.includes("medium") || n.includes("hashnode")) return "medium_hashnode";
  if (n.includes("reddit") && n.includes("saas")) return "reddit_saas";
  return n;
}

function readJSON(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// ── Tier 1: Full post context ──────────────────────────────────────────────

export function getTier1ChannelContext(channelName: string): string {
  const key = normalise(channelName);
  const filePath = TIER1_FILE_MAP[key];
  if (!filePath) return "";

  const data = readJSON(filePath);
  if (!data) return "";

  const cs = data.content_system ?? {};
  const algo = data.algorithm_playbook ?? {};
  const dna = data.channel_dna ?? {};
  const exec = data.execution_sequence ?? {};

  const lines: string[] = [
    `=== ${data.channel} CHANNEL PLAYBOOK ===`,
    "",
    "PLATFORM CULTURE:",
    dna.platform_culture_code ?? "",
    "",
    "WINNING CONTENT TYPES:",
    cs.winning_content_types ?? "",
    "",
    "HOOK FORMULAS:",
    cs.hook_formulas ?? "",
    "",
    "PLATFORM-NATIVE TONE:",
    cs.platform_native_tone ?? "",
    "",
    "PERSONALISATION LAYER:",
    cs.personalisation_layer ?? "",
    "",
    "CTA APPROACH:",
    cs.cta_approach ?? "",
    "",
    "CONTENT TO AVOID:",
    cs.content_to_avoid ?? "",
    "",
    "WHAT THE ALGORITHM REWARDS:",
    algo.what_algorithm_rewards ?? "",
    "",
    "WHAT KILLS REACH:",
    algo.what_kills_reach ?? "",
    "",
    "PEAK POSTING WINDOWS:",
    algo.peak_posting_windows ?? "",
    "",
    "EXECUTION CONTEXT:",
    exec.phase_3_post_content_rules ?? exec.phase_3_content_mix ?? "",
  ];

  return lines.filter((l) => l !== null && l !== undefined).join("\n").trim();
}

// ── Tier 2: Content ideas context ─────────────────────────────────────────

export function getTier2ChannelContext(channelName: string): string {
  const key = normalise(channelName);
  const filePath = TIER2_FILE_MAP[key];
  if (!filePath) return "";

  const data = readJSON(filePath);
  if (!data) return "";

  const ideas = data.content_ideas_system ?? {};
  const dna = data.channel_dna ?? {};
  const algo = data.algorithm_playbook ?? {};
  const categories = ideas.content_idea_categories ?? {};

  const categoryLines = Object.entries(categories).map(([key, val]: [string, any]) => [
    `${key.toUpperCase().replace(/_/g, " ")}:`,
    `  Concept: ${val.concept ?? ""}`,
    `  Hook angles: ${Array.isArray(val.hook_angles) ? val.hook_angles.join(" | ") : (val.hook_angles ?? "")}`,
    `  Format: ${val.format ?? ""}`,
    `  Personalisation: ${val.personalisation_prompt ?? ""}`,
    `  Why it works: ${val.why_it_works ?? ""}`,
  ].join("\n")).join("\n\n");

  const lines: string[] = [
    `=== ${data.channel} CONTENT IDEAS PLAYBOOK ===`,
    "",
    "OUTPUT TYPE: Creative direction only — NOT full scripts. The founder films and delivers in their own voice.",
    "",
    "PLATFORM CULTURE:",
    dna.platform_culture_code ?? "",
    "",
    "CONTENT IDEA CATEGORIES:",
    categoryLines,
    "",
    "WHAT THE ALGORITHM REWARDS:",
    algo.what_algorithm_rewards ?? "",
  ];

  return lines.filter((l) => l !== null && l !== undefined).join("\n").trim();
}

// ── Launch posts: per-platform context ────────────────────────────────────

export function getLaunchPostContext(platformName: string): string {
  const data = readJSON(LAUNCH_FILE);
  if (!data) return "";

  const key = normalise(platformName);
  const platforms = data.must_have_platforms ?? {};

  // Try to match by key
  const platformData = platforms[key] ?? platforms[platformName.toLowerCase().replace(/\s/g, "_")];
  if (!platformData) return "";

  const fmt = platformData.format ?? {};
  const gen = platformData.generation_prompt ?? {};

  const lines: string[] = [
    `=== ${platformData.platform_name} LAUNCH POST PLAYBOOK ===`,
    "",
    `WHY THIS PLATFORM: ${platformData.why_must_have ?? ""}`,
    "",
    "GENERATION SYSTEM PROMPT:",
    gen.system ?? "",
    "",
    "FORMAT RULES:",
    JSON.stringify(fmt, null, 2),
    "",
    "TIMING:",
    platformData.timing ?? "",
    "",
    "WHAT TO AVOID:",
    Array.isArray(platformData.what_to_avoid)
      ? platformData.what_to_avoid.join("\n- ")
      : (platformData.what_to_avoid ?? ""),
  ];

  return lines.filter((l) => l !== null && l !== undefined).join("\n").trim();
}

export function getAllLaunchPlatforms(): string[] {
  const data = readJSON(LAUNCH_FILE);
  if (!data?.must_have_platforms) return [];
  return Object.values(data.must_have_platforms).map((p: any) => p.platform_name);
}

export function getLaunchPlatformData(platformKey: string): any | null {
  const data = readJSON(LAUNCH_FILE);
  if (!data?.must_have_platforms) return null;
  return data.must_have_platforms[platformKey] ?? null;
}

export function getLaunchPlatformKeys(): string[] {
  const data = readJSON(LAUNCH_FILE);
  if (!data?.must_have_platforms) return [];
  return Object.keys(data.must_have_platforms);
}
