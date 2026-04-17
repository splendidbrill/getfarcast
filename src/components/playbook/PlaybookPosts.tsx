"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Copy,
  Check,
  Calendar,
  Clock,
  Hash,
  Flame,
  Lightbulb,
  Megaphone,
  Users,
  Eye,
  MessageSquare,
  TrendingUp,
  Frown,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Lock,
  Sparkles,
  AlertCircle,
  X,
  Zap,
  Timer,
} from "lucide-react";
import type { PostsCalendar, ReadyPost } from "@/lib/types";
import { updatePostFeedback, checkWeekGate, type WeekGateResult } from "@/app/playbook/actions";

const PLATFORM_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: string; label: string }
> = {
  Reddit: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "🤖",
    label: "Reddit",
  },
  LinkedIn: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "in",
    label: "LinkedIn",
  },
  X: {
    color: "text-gray-900",
    bg: "bg-gray-100",
    border: "border-gray-300",
    icon: "𝕏",
    label: "X",
  },
  "Twitter/X": {
    color: "text-gray-900",
    bg: "bg-gray-100",
    border: "border-gray-300",
    icon: "𝕏",
    label: "X",
  },
  Twitter: {
    color: "text-gray-900",
    bg: "bg-gray-100",
    border: "border-gray-300",
    icon: "𝕏",
    label: "X",
  },
  Instagram: {
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    icon: "📸",
    label: "Instagram",
  },
  TikTok: {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "🎵",
    label: "TikTok",
  },
  "Hacker News": {
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "Y",
    label: "HN",
  },
  "Product Hunt": {
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: "🐱",
    label: "PH",
  },
  Facebook: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "📘",
    label: "Facebook",
  },
  Threads: {
    color: "text-gray-800",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "🧵",
    label: "Threads",
  },
  Dev: {
    color: "text-black",
    bg: "bg-gray-100",
    border: "border-gray-300",
    icon: "💻",
    label: "Dev.to",
  },
  GitHub: {
    color: "text-gray-800",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "🐙",
    label: "GitHub",
  },
  Discord: {
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "💬",
    label: "Discord",
  },
  "Slack Communities": {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "💬",
    label: "Slack",
  },
  Quora: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "❓",
    label: "Quora",
  },
  "WhatsApp / Telegram Groups": {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "📱",
    label: "WhatsApp",
  },
  Medium: {
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "✍️",
    label: "Medium",
  },
  Hashnode: {
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "📝",
    label: "Hashnode",
  },
  "Podcast Guesting": {
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "🎙️",
    label: "Podcast",
  },
  "Shopify App Store": {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "🛒",
    label: "Shopify",
  },
  "Chrome Web Store": {
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "🔧",
    label: "Chrome",
  },
  "App Store": {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "📱",
    label: "App Store",
  },
  "Google Play Store": {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "🤖",
    label: "Play Store",
  },
  AppSumo: {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "💰",
    label: "AppSumo",
  },
  Betalist: {
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "📋",
    label: "Betalist",
  },
  G2: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "⭐",
    label: "G2",
  },
  Lobsters: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🦞",
    label: "Lobsters",
  },
  YouTube: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "📺",
    label: "YouTube",
  },
};

const POST_TYPE_ICONS: Record<string, React.ReactNode> = {
  "Origin Story": <Flame className="w-3.5 h-3.5" />,
  "The Problem": <Eye className="w-3.5 h-3.5" />,
  "Behind the Scenes": <Lightbulb className="w-3.5 h-3.5" />,
  "Value-Add": <TrendingUp className="w-3.5 h-3.5" />,
  Educational: <TrendingUp className="w-3.5 h-3.5" />,
  "Hot Take": <Megaphone className="w-3.5 h-3.5" />,
  Contrarian: <Megaphone className="w-3.5 h-3.5" />,
  "Soft Pitch": <Flame className="w-3.5 h-3.5" />,
  Community: <Users className="w-3.5 h-3.5" />,
  Engagement: <MessageSquare className="w-3.5 h-3.5" />,
};

function getPlatformConfig(platform: string) {
  return (
    PLATFORM_CONFIG[platform] || {
      color: "text-gray-700",
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: "📣",
      label: platform,
    }
  );
}

function getPostTypeIcon(postType: string) {
  for (const [key, icon] of Object.entries(POST_TYPE_ICONS)) {
    if (postType.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <MessageSquare className="w-3.5 h-3.5" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
        copied
          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 hover:border-gray-300"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy Post
        </>
      )}
    </button>
  );
}

function PostCard({
  post,
  index,
  playbookId,
  weekIndex,
  defaultOpen,
}: {
  post: ReadyPost;
  index: number;
  playbookId: string;
  weekIndex: number;
  defaultOpen: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const platform = getPlatformConfig(post.platform);

  const [feedbackRating, setFeedbackRating] = useState<"fire" | "ok" | "flop" | undefined>(
    post.feedbackRating
  );
  const [comments, setComments] = useState(post.feedbackComments || "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRating = (rating: "fire" | "ok" | "flop") => {
    setFeedbackRating(rating);
    updatePostFeedback(playbookId, index, rating, undefined, weekIndex);
  };

  const handleCommentsChange = (val: string) => {
    setComments(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updatePostFeedback(playbookId, index, undefined, val, weekIndex);
    }, 1000);
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Day Badge */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-xs font-extrabold">D{post.day}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold ${platform.bg} ${platform.color} ${platform.border} border`}
            >
              <span className="text-[11px] font-black">{platform.icon}</span>
              {platform.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ff6b4e]/10 text-[#ff6b4e] text-xs font-semibold border border-[#ff6b4e]/20">
              {getPostTypeIcon(post.postType)}
              {post.postType}
            </span>
            {feedbackRating && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                  feedbackRating === "fire"
                    ? "bg-orange-100 text-orange-600"
                    : feedbackRating === "ok"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {feedbackRating === "fire" ? "🔥" : feedbackRating === "ok" ? "👍" : "💀"}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#1a1a2e] truncate">{post.hook}</p>
        </div>

        <div
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {post.bestTimeToPost}
            </div>
            {post.subredditOrHashtags && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Hash className="w-3.5 h-3.5 text-gray-400" />
                {post.subredditOrHashtags}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium ml-auto">
              ~{post.characterCount} chars
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
            <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
              {post.body}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">Ready to copy and post</p>
            <CopyButton text={post.body} />
          </div>

          {/* Performance Feedback Loop */}
          <div className="mt-6 pt-4 border-t border-gray-100/50 bg-gray-50/50 -mx-4 -mb-4 px-4 pb-4 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Rate Performance
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRating("fire")}
                  className={`p-2 rounded-lg transition-all ${
                    feedbackRating === "fire"
                      ? "bg-orange-100 text-orange-500 scale-110 shadow-sm"
                      : "text-gray-400 hover:bg-orange-50 hover:text-orange-400"
                  }`}
                  title="Killed It"
                >
                  <Flame className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRating("ok")}
                  className={`p-2 rounded-lg transition-all ${
                    feedbackRating === "ok"
                      ? "bg-blue-100 text-blue-500 scale-110 shadow-sm"
                      : "text-gray-400 hover:bg-blue-50 hover:text-blue-400"
                  }`}
                  title="Did Okay"
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRating("flop")}
                  className={`p-2 rounded-lg transition-all ${
                    feedbackRating === "flop"
                      ? "bg-gray-200 text-gray-600 scale-110 shadow-sm"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  }`}
                  title="Flopped"
                >
                  <Frown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {feedbackRating !== undefined && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-2">
                <div className="relative">
                  <MessageSquare className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={comments}
                    onChange={(e) => handleCommentsChange(e.target.value)}
                    placeholder="Paste the exact comments this got (or your raw thoughts) to train the AI for next time..."
                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/20 focus:border-[#ff6b4e]/40 transition-all resize-none h-20 shadow-sm"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Auto-saving
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WeekSection — collapsible accordion card for one week
// ─────────────────────────────────────────────────────────────
function WeekSection({
  week,
  weekIndex,
  playbookId,
  defaultExpanded,
}: {
  week: PostsCalendar;
  weekIndex: number;
  playbookId: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activePlatform, setActivePlatform] = useState<string>("All");
  const platforms = [...new Set(week.posts.map((p) => p.platform))];

  const filteredPosts =
    activePlatform === "All"
      ? week.posts
      : week.posts.filter((p) => p.platform === activePlatform);

  const ratedCount = week.posts.filter((p) => p.feedbackRating !== undefined).length;
  const totalCount = week.posts.length;
  const ratingPercent = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Week Header — click to collapse/expand */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shrink-0 shadow-sm">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-bold text-[#1a1a2e]">{week.weekOf}</h3>
            <span className="text-xs text-gray-400 font-medium">
              {totalCount} posts across {platforms.length} platform{platforms.length !== 1 ? "s" : ""}
            </span>
            {ratedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                {ratedCount}/{totalCount} rated ({ratingPercent}%)
              </span>
            )}
          </div>
          {week.generatedAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Generated {new Date(week.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Week Body */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          {/* Platform filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActivePlatform("All")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                activePlatform === "All"
                  ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                  : "bg-white text-[#1a1a2e] border-gray-300 hover:border-[#1a1a2e]"
              }`}
            >
              All ({week.posts.length})
            </button>
            {platforms.map((platform) => {
              const cfg = getPlatformConfig(platform);
              const count = week.posts.filter((p) => p.platform === platform).length;
              const isActive = activePlatform === platform;
              return (
                <button
                  key={platform}
                  onClick={() => setActivePlatform(platform)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    isActive
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {cfg.icon} {cfg.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Post cards */}
          <div className="space-y-3">
            {filteredPosts.map((post, i) => (
              <PostCard
                key={`${weekIndex}-${post.day}-${post.platform}`}
                post={post}
                index={week.posts.indexOf(post)}
                playbookId={playbookId}
                weekIndex={weekIndex}
                defaultOpen={i === 0 && weekIndex === 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FeedbackGateModal
// ─────────────────────────────────────────────────────────────
function FeedbackGateModal({
  targetWeek,
  gate,
  onClose,
}: {
  targetWeek: number;
  gate: WeekGateResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>

        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">
          Rate more posts to unlock Week {targetWeek}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          To generate smarter Week {targetWeek} content, the AI needs performance signals from
          at least <span className="font-bold text-[#1a1a2e]">10%</span> of your Week{" "}
          {targetWeek - 1} posts. This helps it understand what resonates with your audience.
        </p>

        {/* Progress bar */}
        <div className="bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, ((gate.feedbackGiven ?? 0) / (gate.minimumRequired ?? 1)) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-400 font-medium mb-6">
          {gate.feedbackGiven ?? 0} of {gate.minimumRequired} posts rated — need{" "}
          <span className="text-[#ff6b4e] font-bold">{gate.feedbackNeeded} more</span>
        </p>

        <div className="bg-[#ff6b4e]/5 border border-[#ff6b4e]/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-[#1a1a2e] font-semibold mb-1">How to rate posts:</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>🔥 Killed it</span>
            <span>👍 Did okay</span>
            <span>💀 Flopped</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Expand any post above and tap one of the rating buttons.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold hover:bg-black transition-colors"
        >
          Got it — I'll go rate some posts
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GenerateNextWeekButton
// Shows the CTA (or a locked state) below each week section.
// ─────────────────────────────────────────────────────────────
function GenerateNextWeekButton({
  targetWeek,
  playbookId,
  onGenerate,
  generating,
}: {
  targetWeek: number;
  playbookId: string;
  onGenerate: (weekNumber: number) => void;
  generating: boolean;
}) {
  const [gate, setGate] = useState<WeekGateResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Re-check gate every 30 seconds in case timer expires
    const check = () => setGate(checkWeekGate(playbookId, targetWeek));
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [playbookId, targetWeek]);

  if (!gate) return null;

  const handleClick = () => {
    if (generating) return;
    // Re-check fresh
    const freshGate = checkWeekGate(playbookId, targetWeek);
    setGate(freshGate);
    if (!freshGate.allowed) {
      if (freshGate.feedbackGateFailed) {
        setShowModal(true);
      }
      // Time gate: just show the locked button UI (no modal needed)
      return;
    }
    onGenerate(targetWeek);
  };

  const isLocked = !gate.allowed;
  const timeGateOnly = gate.timeGateFailed && !gate.feedbackGateFailed;

  return (
    <>
      {showModal && gate.feedbackGateFailed && (
        <FeedbackGateModal
          targetWeek={targetWeek}
          gate={gate}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isLocked ? "bg-gray-100" : "bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a]"
            }`}
          >
            {isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a1a2e]">
              {generating
                ? `Generating Week ${targetWeek}…`
                : isLocked
                ? `Week ${targetWeek} Locked`
                : `Generate Week ${targetWeek}`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {generating ? (
                "Writing AI-powered posts based on your Week-1 signals…"
              ) : timeGateOnly ? (
                <span className="flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-amber-500" />
                  Unlocks in{" "}
                  <span className="font-semibold text-amber-600">
                    {gate.hoursRemaining} hour{gate.hoursRemaining !== 1 ? "s" : ""}
                  </span>{" "}
                  — post Week {targetWeek - 1} content first
                </span>
              ) : gate.feedbackGateFailed ? (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Rate{" "}
                  <span className="font-semibold text-amber-600">
                    {gate.feedbackNeeded} more post{gate.feedbackNeeded !== 1 ? "s" : ""}
                  </span>{" "}
                  to unlock
                </span>
              ) : (
                "AI learns from your Week-1 performance — content gets smarter each week"
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleClick}
          disabled={generating}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
            generating
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : isLocked
              ? "bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
              : "bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white hover:shadow-lg hover:shadow-[#ff6b4e]/20 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              Writing…
            </>
          ) : isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              Locked
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Week {targetWeek}
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PlaybookPosts — main export
// ─────────────────────────────────────────────────────────────
export function PlaybookPosts({
  playbookId,
  postsCalendars,
  selectedChannels,
  onWeekGenerated,
}: {
  playbookId: string;
  postsCalendars: PostsCalendar[];
  selectedChannels: string[];
  onWeekGenerated: (updatedCalendars: PostsCalendar[]) => void;
}) {
  const [generatingWeek, setGeneratingWeek] = useState<number | null>(null);
  const [generationError, setGenerationError] = useState<string>("");

  const handleGenerateWeek = useCallback(
    async (weekNumber: number) => {
      setGeneratingWeek(weekNumber);
      setGenerationError("");

      try {
        // 1. Grab the active session from Supabase
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Pass the token in the Authorization header
        const response = await fetch("/api/generate-content", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}` // <--- THE FIX
          },
          body: JSON.stringify({ playbookId, selectedChannels, weekNumber }),
        });

        if (!response.ok) throw new Error("Generation request failed");
        if (!response.body) throw new Error("No response body");

        // ... keep the rest of your existing stream reading code ...

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const line = part.replace(/^data: /, "").trim();
            if (!line) continue;
            try {
              const event = JSON.parse(line);
              if (event.type === "gate_error") {
                setGenerationError(event.data.reason);
                setGeneratingWeek(null);
                return;
              }
              if (event.type === "error") {
                setGenerationError(event.data.message);
                setGeneratingWeek(null);
                return;
              }
              if (event.type === "complete") {
                const updatedCalendars: PostsCalendar[] = Array.isArray(
                  event.data.playbook?.postsCalendar
                )
                  ? event.data.playbook.postsCalendar
                  : event.data.playbook?.postsCalendar
                  ? [event.data.playbook.postsCalendar]
                  : postsCalendars;

                // Also persist to localStorage
                const raw = localStorage.getItem(`playbook_${playbookId}`);
                if (raw) {
                  try {
                    const stored = JSON.parse(raw);
                    const pb = stored.playbook || stored;
                    pb.postsCalendar = updatedCalendars;
                    stored.playbook = pb;
                    localStorage.setItem(`playbook_${playbookId}`, JSON.stringify(stored));
                  } catch {}
                }

                onWeekGenerated(updatedCalendars);
                setGeneratingWeek(null);
                return;
              }
            } catch {}
          }
        }
      } catch (err) {
        setGenerationError(err instanceof Error ? err.message : "Unknown error");
        setGeneratingWeek(null);
      }
    },
    [playbookId, selectedChannels, postsCalendars, onWeekGenerated]
  );

  // The latest week available
  const latestWeekIndex = postsCalendars.length - 1;
  const nextWeekNumber = (postsCalendars[latestWeekIndex]?.weekNumber ?? postsCalendars.length) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#ff6b4e]/5 to-transparent rounded-3xl p-6 sm:p-8 border border-[#ff6b4e]/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a2e]">Content Engine</h2>
            <p className="text-xs text-gray-500 font-medium">
              {postsCalendars.length} week{postsCalendars.length !== 1 ? "s" : ""} generated —
              feedback trains the AI for next week
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-medium mt-3 leading-relaxed">
          Rate each post after you publish it. The AI uses your ratings to write smarter content
          every week — more of what works, less of what doesn't.
        </p>
      </div>

      {/* Week sections + generate buttons */}
      <div className="space-y-4">
        {postsCalendars.map((week, idx) => (
          <div key={week.weekNumber ?? idx} className="space-y-4">
            <WeekSection
              week={week}
              weekIndex={idx}
              playbookId={playbookId}
              defaultExpanded={idx === latestWeekIndex}
            />

            {/* Show "Generate next week" button below the LAST generated week */}
            {idx === latestWeekIndex && (
              <>
                <GenerateNextWeekButton
                  targetWeek={nextWeekNumber}
                  playbookId={playbookId}
                  onGenerate={handleGenerateWeek}
                  generating={generatingWeek === nextWeekNumber}
                />
                {generationError && (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700">Generation failed</p>
                      <p className="text-xs text-red-500 mt-0.5">{generationError}</p>
                    </div>
                    <button
                      onClick={() => setGenerationError("")}
                      className="ml-auto text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="rounded-2xl bg-[#1a1a2e] p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">Post consistently. Win the algorithm.</p>
          <p className="text-gray-400 text-xs font-medium mt-0.5">
            Expand each post and hit Copy Post to schedule it.
          </p>
        </div>
        <Calendar className="w-8 h-8 text-[#ff6b4e] shrink-0" />
      </div>
    </div>
  );
}
