import fs from "fs";
import path from "path";
import { getChannelStrategyContext } from "./contentKnowledgeBase";

// ==========================================
// Knowledge Base Reader
// Primary: json2 expert playbooks (via contentKnowledgeBase)
// Fallback: markdown files for channels not in json2
// ==========================================

const CHANNEL_FILE_MAP: Record<string, string> = {
  "hacker news": "hackernews.md",
  hackernews: "hackernews.md",
  "product hunt": "producthunt.md",
  producthunt: "producthunt.md",
};

const KB_BASE_PATH = path.join(process.cwd(), "src", "knowledge", "channels");

export async function getChannelPlaybook(
  channelName: string
): Promise<string | null> {
  // Try json2 expert playbooks first
  const json2Context = getChannelStrategyContext(channelName);
  if (json2Context) return json2Context;

  // Fall back to markdown for channels not in json2 (HN, Product Hunt, etc.)
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
