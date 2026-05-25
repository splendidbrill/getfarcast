const BANNED_WORDS = [
  "delve", "unpack", "synergy", "leverage", "utilize", "streamline",
  "cutting-edge", "game-changer", "revolutionize", "seamlessly", "robust",
  "holistic", "ecosystem", "unlock", "empower", "navigate", "landscape",
  "journey", "pivotal", "transformative", "actionable", "deep dive",
  "in conclusion", "to summarize", "in summary", "i hope this helps",
  "as an ai", "it's worth noting", "importantly", "at the end of the day",
  "the bottom line", "moving forward",
];

export function scoreVoiceFit(text: string, platform: "linkedin" | "x" | "reddit"): number {
  let score = 1.0;
  const lower = text.toLowerCase();

  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) score -= 0.10;
  }

  // Em-dash is a strong AI tell
  const emDashCount = (text.match(/—/g) ?? []).length;
  score -= emDashCount * 0.08;

  if (platform === "x") {
    if (text.length > 280) score -= 0.30;
    if (/#\w/.test(text)) score -= 0.25;
    if (/\*\*/.test(text)) score -= 0.10;
  }

  if (platform === "linkedin") {
    const paras = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const broetryCount = paras.filter((p) => {
      const sentences = p.trim().split(/[.!?]+/).filter((s) => s.trim().length > 3);
      return sentences.length <= 1;
    }).length;
    score -= broetryCount * 0.07;

    if (/\*\*[^*]+:\*\*/.test(text)) score -= 0.15;
    if (/^In conclusion|^To summarize|^In summary/im.test(text)) score -= 0.20;
  }

  if (platform === "reddit") {
    const adTerms = ["sign up", "try it now", "learn more", "click here", "check out our", "our product"];
    for (const term of adTerms) {
      if (lower.includes(term)) score -= 0.15;
    }
  }

  return Math.max(0, Math.round(Math.min(1, score) * 100) / 100);
}
