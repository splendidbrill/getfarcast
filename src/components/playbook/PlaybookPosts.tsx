"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { PostsCalendar, ReadyPost } from "@/lib/types";

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

function PostCard({ post, index }: { post: ReadyPost; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const platform = getPlatformConfig(post.platform);

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
        </div>
      )}
    </div>
  );
}

export function PlaybookPosts({
  postsCalendar,
}: {
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
          <PostCard key={`${post.day}-${post.platform}`} post={post} index={i} />
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
