import fs from "fs";
import path from "path";

// ==========================================
// Knowledge Base Reader
// Reads expert channel playbooks from markdown files
// ==========================================

const CHANNEL_FILE_MAP: Record<string, string> = {
  reddit: "reddit.md",
  linkedin: "linkedin.md",
  instagram: "instagram.md",
  "hacker news": "hackernews.md",
  hackernews: "hackernews.md",
  "product hunt": "producthunt.md",
  producthunt: "producthunt.md",
  "x (twitter)": "twitter_x.md",
  twitter: "twitter_x.md",
  x: "twitter_x.md",
  youtube: "youtube.md",
  tiktok: "tiktok.md",
};

const KB_BASE_PATH = path.join(process.cwd(), "src", "knowledge", "channels");

export async function getChannelPlaybook(
  channelName: string
): Promise<string | null> {
  const key = channelName.toLowerCase().trim();
  const fileName = CHANNEL_FILE_MAP[key];

  if (!fileName) return null;

  const filePath = path.join(KB_BASE_PATH, fileName);

  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`Knowledge base not found for channel: ${channelName}`);
    return null;
  }
}

export async function getAvailableChannels(): Promise<string[]> {
  return Object.keys(CHANNEL_FILE_MAP);
}
