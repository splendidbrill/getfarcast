"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { Playbook, CalendarPost } from "@/lib/types";

const PLATFORM_CHANNELS: Record<string, string[]> = {
  twitter_x: ["X (Twitter)", "X", "Twitter"],
  linkedin: ["LinkedIn"],
  reddit: ["Reddit"],
};

const PLATFORM_LABEL: Record<string, string> = {
  twitter_x: "X (Twitter)",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

const PLATFORM_COLORS: Record<string, { badge: string; card: string; border: string }> = {
  twitter_x: {
    badge: "bg-gray-100 text-gray-700",
    card: "bg-gray-50",
    border: "border-gray-100",
  },
  linkedin: {
    badge: "bg-blue-50 text-blue-700",
    card: "bg-blue-50/40",
    border: "border-blue-100",
  },
  reddit: {
    badge: "bg-orange-50 text-orange-700",
    card: "bg-orange-50/40",
    border: "border-orange-100",
  },
};

function PostCard({ post, platform }: { post: CalendarPost; platform: string }) {
  const colors = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.twitter_x;
  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.card} p-5 space-y-2.5`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
          {PLATFORM_LABEL[platform]}
        </span>
        {post.type && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-black/5 text-slate-500 capitalize">
            {post.type.replace(/_/g, " ")}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">Day {post.day}</span>
      </div>
      {post.hook && (
        <p className="text-[13.5px] font-bold text-[#1a1a2e] leading-snug">{post.hook}</p>
      )}
      {post.body && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{post.body}</p>
      )}
    </div>
  );
}

function BlurredPostCard({ platform, onClick }: { platform: string; onClick: () => void }) {
  const colors = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.twitter_x;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border ${colors.border} ${colors.card} p-5 relative overflow-hidden group cursor-pointer`}
    >
      <div className="space-y-2.5 blur-sm select-none pointer-events-none" aria-hidden>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
            {PLATFORM_LABEL[platform]}
          </span>
        </div>
        <div className="h-4 w-3/4 bg-gray-300 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-gray-200 rounded-full" />
          <div className="h-3 w-5/6 bg-gray-200 rounded-full" />
          <div className="h-3 w-4/6 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] group-hover:bg-white/80 transition-all">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-[#1a1a2e] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-bold text-[#1a1a2e]">Sign in to view</span>
        </div>
      </div>
    </button>
  );
}

export function SharedPosts({
  playbook,
}: {
  playbook: Playbook;
}) {
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Build display items: 1 visible + blurred rest, per platform
  const display: Array<
    | { type: "post"; post: CalendarPost; platform: string }
    | { type: "blurred"; platform: string; key: string }
  > = [];

  for (const [platform, channelNames] of Object.entries(PLATFORM_CHANNELS)) {
    const channel = playbook.channels?.find((c) =>
      channelNames.some((n) => c.name.toLowerCase().includes(n.toLowerCase()))
    );
    if (!channel || !channel.contentCalendar?.length) continue;

    const [first, ...rest] = channel.contentCalendar;
    display.push({ type: "post", post: first, platform });

    const blurredCount = Math.min(rest.length, 3);
    for (let i = 0; i < blurredCount; i++) {
      display.push({ type: "blurred", platform, key: `blur-${platform}-${i}` });
    }
  }

  const totalPosts = playbook.channels?.reduce(
    (sum, ch) => sum + (ch.contentCalendar?.length ?? 0),
    0
  ) ?? 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a2e]">Content Posts</h2>
            <p className="text-sm text-gray-500 mt-1">
              30-day content calendar across X, LinkedIn, and Reddit.
            </p>
          </div>
          {totalPosts > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-sm font-bold text-blue-700">
              {totalPosts} total posts
            </div>
          )}
        </div>

        {display.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium">No content calendar found.</p>
          </div>
        )}

        {display.length > 0 && (
          <div className="space-y-3">
            {display.map((item) =>
              item.type === "post" ? (
                <PostCard key={`${item.platform}-${item.post.day}`} post={item.post} platform={item.platform} />
              ) : (
                <BlurredPostCard
                  key={item.key}
                  platform={item.platform}
                  onClick={() => setShowSignInModal(true)}
                />
              )
            )}
          </div>
        )}

        {totalPosts > 3 && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowSignInModal(true)}
              className="text-sm font-semibold text-[#F25C2C] hover:underline"
            >
              Sign in to access all {totalPosts} posts →
            </button>
          </div>
        )}
      </div>

      {showSignInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSignInModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A3D] to-[#F25C2C] flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Unlock full content calendar</h3>
            <p className="text-sm text-gray-500 mb-6">
              Sign in to GetFarcast to access all {totalPosts} posts, copy them, generate new ones daily, and create your own AI growth playbook.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#F25C2C] to-[#FF7A3D] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all"
            >
              Sign in with Google
            </Link>
            <button
              onClick={() => setShowSignInModal(false)}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
