"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";
import type { PostsCalendar, ReadyPost } from "@/lib/types";
import { updatePostFeedback } from "@/app/playbook/actions";

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
  "Hashnode": {
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
  "AppSumo": {
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "💰",
    label: "AppSumo",
  },
  "Betalist": {
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    icon: "📋",
    label: "Betalist",
  },
  "G2": {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "⭐",
    label: "G2",
  },
  "Lobsters": {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "🦞",
    label: "Lobsters",
  },
  "YouTube": {
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

function PostCard({ post, index, playbookId }: { post: ReadyPost; index: number; playbookId: string }) {
  const [expanded, setExpanded] = useState(index === 0);
  const platform = getPlatformConfig(post.platform);
  
  const [feedbackRating, setFeedbackRating] = useState<"fire" | "ok" | "flop" | undefined>(post.feedbackRating);
  const [comments, setComments] = useState(post.feedbackComments || "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRating = (rating: "fire" | "ok" | "flop") => {
    setFeedbackRating(rating);
    updatePostFeedback(playbookId, index, rating, undefined);
  };

  const handleCommentsChange = (val: string) => {
    setComments(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updatePostFeedback(playbookId, index, undefined, val);
    }, 1000);
  };

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
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
            {/* Platform Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2. py-0.5 rounded-md text-xs font-bold ${platform.bg} ${platform.color} ${platform.border} border`}
            >
              <span className="text-[11px] font-black">{platform.icon}</span>
              {platform.label}
            </span>
            {/* Post Type */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ff6b4e]/10 text-[#ff6b4e] text-xs font-semibold border border-[#ff6b4e]/20">
              {getPostTypeIcon(post.postType)}
              {post.postType}
            </span>
          </div>
          {/* Hook preview */}
          <p className="text-sm font-semibold text-[#1a1a2e] truncate">
            {post.hook}
          </p>
        </div>

        {/* Expand indicator */}
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
          {/* Metadata Row */}
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

          {/* Post Body */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
            <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
              {post.body}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">
              Ready to copy and post
            </p>
            <CopyButton text={post.body} />
          </div>

          {/* Performance Feedback Loop */}
          <div className="mt-6 pt-4 border-t border-gray-100/50 bg-gray-50/50 -mx-4 -mb-4 px-4 pb-4 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rate Performance</span>
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

            {/* Raw Comments Dropdown (Visible if rated) */}
            {(feedbackRating !== undefined) && (
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
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auto-saving</span>
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

export function PlaybookPosts({
  playbookId,
  postsCalendar,
}: {
  playbookId: string;
  postsCalendar: PostsCalendar;
}) {
  // Group posts by platform to show unique platforms
  const platforms = [...new Set(postsCalendar.posts.map((p) => p.platform))];
  const [filterPlatform, setFilterPlatform] = useState<string>("All");

  const filteredPosts =
    filterPlatform === "All"
      ? postsCalendar.posts
      : postsCalendar.posts.filter((p) => p.platform === filterPlatform);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#ff6b4e]/5 to-transparent rounded-3xl p-6 sm:p-8 border border-[#ff6b4e]/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a2e]">
              {postsCalendar.weekOf}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {postsCalendar.posts.length} copy-paste ready posts across{" "}
              {platforms.length} platform{platforms.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-medium mt-3 leading-relaxed">
          Every post below is ready to publish. Click any card to expand and copy the full text. The hooks and timing have been tuned for each platform.
        </p>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterPlatform("All")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            filterPlatform === "All"
              ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
          }`}
        >
          All ({postsCalendar.posts.length})
        </button>
        {platforms.map((platform) => {
          const cfg = getPlatformConfig(platform);
          const count = postsCalendar.posts.filter(
            (p) => p.platform === platform
          ).length;
          return (
            <button
              key={platform}
              onClick={() => setFilterPlatform(platform)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filterPlatform === platform
                  ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {cfg.icon} {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Post Cards */}
      <div className="space-y-3">
        {filteredPosts.map((post, i) => (
          <PostCard key={`${post.day}-${post.platform}`} post={post} index={i} playbookId={playbookId} />
        ))}
      </div>

      {/* Copy All CTA */}
      <div className="rounded-2xl bg-[#1a1a2e] p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">Post consistently. Win the algorithm.</p>
          <p className="text-gray-400 text-xs font-medium mt-0.5">
            Expand each day and hit Copy Post to schedule it.
          </p>
        </div>
        <Calendar className="w-8 h-8 text-[#ff6b4e] shrink-0" />
      </div>
    </div>
  );
}
