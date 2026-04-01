"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Eye, Users, Zap, AlertCircle, CheckCircle } from "lucide-react";

const channels = [
  {
    name: "Reddit",
    icon: "💬",
    color: "from-orange-500 to-red-500",
    ringColor: "ring-orange-500/20",
    stats: {
      users: "500M+",
      engagement: "High",
      cost: "Free",
    },
    pros: [
      "Authentic community discussions",
      "Subreddit-level targeting",
      "High trust, high conversion",
    ],
    caution: "Anti-self-promo culture. Nuance is everything.",
    bestFor: "Technical founders, developer tools, niche products",
  },
  {
    name: "LinkedIn",
    icon: "💼",
    color: "from-blue-500 to-blue-600",
    ringColor: "ring-blue-500/20",
    stats: {
      users: "1B+",
      engagement: "Medium-High",
      cost: "Free",
    },
    pros: [
      "Professional audience with buying power",
      "Organic reach still works",
      "Great for B2B and SaaS",
    ],
    caution: "Avoid looking like a bro-marketer. Substance wins.",
    bestFor: "B2B founders, SaaS, enterprise tools",
  },
  {
    name: "Instagram",
    icon: "📸",
    color: "from-pink-500 to-purple-600",
    ringColor: "ring-pink-500/20",
    stats: {
      users: "3B+",
      engagement: "High",
      cost: "Free",
    },
    pros: [
      "Reels algorithm favors new creators",
      "Visual storytelling builds brand",
      "Massive Gen Z and Millennial audience",
    ],
    caution: "Needs consistent visual quality. Not text-first.",
    bestFor: "Consumer products, D2C, creator tools",
  },
];

export function ChannelShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="channels"
      className="relative py-28 sm:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-3">
            Supported Channels
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Know exactly where to post.
          </h2>
          <p className="text-surface-200/50 max-w-lg mx-auto">
            We don't just tell you "go post on social media." We give you
            channel-specific strategies with algorithm insights and templates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {channels.map((channel, i) => (
            <div
              key={channel.name}
              className={`glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-700 group ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {channel.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{channel.name}</h3>
                  <p className="text-xs text-surface-200/40">{channel.bestFor}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-3 mb-5">
                {[
                  { icon: Users, label: "Users", value: channel.stats.users },
                  { icon: TrendingUp, label: "Engagement", value: channel.stats.engagement },
                  { icon: Eye, label: "Cost", value: channel.stats.cost },
                ].map((stat) => {
                  const StatIcon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-2 text-center"
                    >
                      <StatIcon className="w-3.5 h-3.5 text-surface-200/30 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-white">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-surface-200/30 mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Pros */}
              <div className="space-y-2 mb-4">
                {channel.pros.map((pro) => (
                  <div key={pro} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-surface-200/60">{pro}</span>
                  </div>
                ))}
              </div>

              {/* Caution */}
              <div className="flex items-start gap-2 bg-amber-500/5 rounded-lg px-3 py-2.5 border border-amber-500/10">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-amber-400/80">{channel.caution}</span>
              </div>

              {/* Generated badge */}
              <div className="mt-5 flex items-center gap-2">
                <Zap className="w-3 h-3 text-brand-400" />
                <span className="text-[10px] text-surface-200/30 uppercase tracking-wider font-medium">
                  Full playbook generated for this channel
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* More channels teaser */}
        <div className="mt-10 text-center">
          <p className="text-sm text-surface-200/40">
            More channels coming soon:{" "}
            <span className="text-surface-200/60">
              X (Twitter), Product Hunt, Hacker News, TikTok, Discord, Slack
              Communities
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
