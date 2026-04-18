"use client";

import { useState, useEffect } from "react";
import { Rocket, Check, Copy, RefreshCw, Loader2, Sparkles, Clock, ArrowLeft } from "lucide-react";
import type { Playbook } from "@/lib/types";
import Link from "next/link";

interface PostSection {
  label: string;
  content: string;
}

interface GeneratedPost {
  platformKey: string;
  platformName: string;
  sections: PostSection[];
  timing?: string;
  generatedAt: string;
}

interface Props {
  playbook: Playbook;
}

const LAUNCH_PLATFORMS = [
  { key: "product_hunt", name: "Product Hunt", emoji: "🚀", desc: "Tagline + description + maker comment" },
  { key: "hacker_news", name: "Hacker News", emoji: "🔶", desc: "Show HN title + body" },
  { key: "indie_hackers", name: "Indie Hackers", emoji: "💡", desc: "Milestone post with honest numbers" },
  { key: "reddit_saas", name: "Reddit — r/SaaS", emoji: "👽", desc: "Community-native founder post" },
  { key: "devto", name: "Dev.to", emoji: "👾", desc: "Technical launch article" },
  { key: "betalist", name: "BetaList", emoji: "⚡", desc: "Early adopter listing" },
  { key: "uneed", name: "Uneed", emoji: "🎯", desc: "PH alternative listing + maker comment" },
  { key: "microlaunch", name: "MicroLaunch", emoji: "🛠️", desc: "Indie hacker listing" },
  { key: "medium_hashnode", name: "Medium / Hashnode", emoji: "✍️", desc: "Long-form founding story" },
  { key: "linkedin_personal", name: "LinkedIn Personal", emoji: "💼", desc: "Network launch post" },
  { key: "twitter_launch_thread", name: "Twitter / X Thread", emoji: "🐦", desc: "6–8 tweet launch thread" },
] as const;

type PlatformKey = (typeof LAUNCH_PLATFORMS)[number]["key"];

const STORAGE_KEY = (id: string) => `launch_posts_${id}`;

function buildIcpSummary(playbook: Playbook) {
  const icp = playbook.icp;
  return `${icp.title}. ${icp.summary} Pain points: ${icp.painPoints.slice(0, 3).join(", ")}.`;
}

function buildDiaryContext(): string {
  try {
    const logs = JSON.parse(localStorage.getItem("farcast_daily_logs") || "{}");
    const entries = Object.values(logs) as any[];
    if (!entries.length) return "";
    const recent = entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((e) => `[${e.date}] ${e.content}`)
      .join("\n\n");
    return recent;
  } catch {
    return "";
  }
}

// ── Section card ───────────────────────────────────────────────────────────

function SectionCard({ section }: { section: PostSection }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(section.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{section.label}</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{section.content}</p>
      </div>
    </div>
  );
}

// ── Platform post card ─────────────────────────────────────────────────────

function PostCard({
  post,
  onRegenerate,
  regenerating,
}: {
  post: GeneratedPost;
  onRegenerate: (platformKey: string) => void;
  regenerating: boolean;
}) {
  const platform = LAUNCH_PLATFORMS.find((p) => p.key === post.platformKey);

  return (
    <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{platform?.emoji ?? "🚀"}</span>
          <div>
            <h3 className="text-sm font-bold text-[#1a1a2e]">{post.platformName}</h3>
            {post.timing && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {post.timing}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onRegenerate(post.platformKey)}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff6b4e] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </button>
      </div>
      <div className="p-5 space-y-5">
        {post.sections.map((s) => (
          <SectionCard key={s.label} section={s} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function LaunchPostsPage({ playbook }: Props) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>([
    "product_hunt",
    "hacker_news",
    "indie_hackers",
    "twitter_launch_thread",
    "linkedin_personal",
  ]);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load saved posts
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(playbook.id));
      if (saved) setGeneratedPosts(JSON.parse(saved));
    } catch {}
  }, [playbook.id]);

  const togglePlatform = (key: PlatformKey) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const callAPI = async (platformKey: string): Promise<GeneratedPost> => {
    const res = await fetch("/api/generate-launch-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformKey,
        productName: playbook.productName,
        productUrl: (playbook as any).productUrl || "",
        productDescription: (playbook as any).productDescription || playbook.summary,
        icpSummary: buildIcpSummary(playbook),
        diaryContext: buildDiaryContext(),
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Generation failed");
    }
    const data = await res.json();
    return { ...data, generatedAt: new Date().toISOString() };
  };

  const handleGenerate = async () => {
    if (!selectedPlatforms.length) return;
    setGenerating(true);
    setError("");
    try {
      const results = await Promise.all(selectedPlatforms.map(callAPI));
      setGeneratedPosts(results);
      localStorage.setItem(STORAGE_KEY(playbook.id), JSON.stringify(results));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (platformKey: string) => {
    setRegeneratingKey(platformKey);
    setError("");
    try {
      const fresh = await callAPI(platformKey);
      const updated = generatedPosts.map((p) => (p.platformKey === platformKey ? fresh : p));
      if (!updated.find((p) => p.platformKey === platformKey)) updated.push(fresh);
      setGeneratedPosts(updated);
      localStorage.setItem(STORAGE_KEY(playbook.id), JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegeneratingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1a2e]">
      {/* Background */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 78, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 78, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/playbook/${playbook.id}`}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a1a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Playbook
            </Link>
            <div className="h-5 w-px bg-black/10" />
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-[#ff6b4e]" />
              <h1 className="text-sm font-bold text-[#1a1a2e]">Launch Your Product</h1>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium hidden sm:block">
            {playbook.productName}
          </p>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Platform-native launch posts</h2>
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
            One carefully crafted post per platform — each written in that platform&apos;s exact native language. Select where you&apos;re launching and generate. If you have Daily Log entries, they&apos;ll be used to make posts more personal.
          </p>
        </div>

        {/* Platform selection */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Select platforms ({selectedPlatforms.length} selected)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LAUNCH_PLATFORMS.map((p) => {
              const isSelected = selectedPlatforms.includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => togglePlatform(p.key)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-[#ff6b4e] bg-[#ff6b4e]/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight ${isSelected ? "text-[#ce4a2f]" : "text-gray-800"}`}>
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{p.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? "border-[#ff6b4e] bg-[#ff6b4e]" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedPlatforms.length === 0}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold shadow-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#ff6b4e]" />
            )}
            {generating
              ? `Generating ${selectedPlatforms.length} posts...`
              : generatedPosts.length > 0
              ? "Regenerate All Selected"
              : `Generate ${selectedPlatforms.length} Launch Posts`}
          </button>
          {generatedPosts.length > 0 && (
            <p className="text-xs text-gray-400">
              {generatedPosts.length} post{generatedPosts.length !== 1 ? "s" : ""} generated
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Generated posts */}
        {generatedPosts.length > 0 && (
          <div className="space-y-6 pt-2">
            <div className="h-px bg-black/5" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Generated Posts
            </p>
            {generatedPosts.map((post) => (
              <PostCard
                key={post.platformKey}
                post={post}
                onRegenerate={handleRegenerate}
                regenerating={regeneratingKey === post.platformKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
