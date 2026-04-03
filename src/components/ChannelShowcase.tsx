"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Eye, Users, Zap, AlertCircle, CheckCircle } from "lucide-react";

const channels = [
  {
    name: "Reddit",
    icon: "💬",
    color: "from-orange-400 to-red-500",
    bgMuted: "bg-orange-50",
    textLight: "text-orange-500",
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
    color: "from-blue-400 to-blue-600",
    bgMuted: "bg-blue-50",
    textLight: "text-blue-600",
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
    bgMuted: "bg-pink-50",
    textLight: "text-pink-500",
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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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
      className="relative py-28 sm:py-36 overflow-hidden bg-[#faf8f6]"
    >
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-blue-500/5 rounded-full blur-[100px] animate-float-delayed pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">
            Supported Channels
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight mb-6">
            Know exactly where to post.
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
            We don't just tell you "go post on social media." We give you
            channel-specific strategies with algorithm insights and ready-to-use templates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {channels.map((channel, i) => (
            <div
              key={channel.name}
              className={`bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all duration-500 group cursor-default relative overflow-hidden ${
                hoveredCard === i
                  ? "border-blue-200 -translate-y-2 shadow-xl shadow-blue-500/5"
                  : "hover:border-gray-200"
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center text-2xl shadow-md transition-transform duration-300 ${
                      hoveredCard === i ? "scale-110 rotate-3" : ""
                    }`}
                  >
                    {channel.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-[#1a1a2e] transition-colors ${
                      hoveredCard === i ? channel.textLight : ""
                    }`}>
                      {channel.name}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 mt-1">{channel.bestFor}</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 mb-6">
                  {[
                    { icon: Users, label: "Users", value: channel.stats.users },
                    { icon: TrendingUp, label: "Engagement", value: channel.stats.engagement },
                    { icon: Eye, label: "Cost", value: channel.stats.cost },
                  ].map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-center transition-colors duration-200 group-hover:bg-white group-hover:border-gray-200"
                      >
                        <StatIcon className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-sm font-bold text-[#1a1a2e]">
                          {stat.value}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Pros */}
                <div className="space-y-3 mb-6">
                  {channel.pros.map((pro, idx) => (
                    <div
                      key={pro}
                      className="flex items-start gap-3 transition-all duration-300"
                      style={{
                        transitionDelay: `${idx * 50}ms`,
                        transform: hoveredCard === i ? "translateX(0)" : "translateX(-4px)",
                      }}
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-gray-600 leading-snug">{pro}</span>
                    </div>
                  ))}
                </div>

                {/* Caution */}
                <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-100 transition-colors duration-200">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs font-semibold text-amber-700 leading-snug">{channel.caution}</span>
                </div>

                {/* Generated badge */}
                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Zap className={`w-4 h-4 text-blue-500 transition-all duration-300 ${hoveredCard === i ? "animate-pulse-soft" : ""}`} />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    Full playbook generated for this channel
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More channels teaser */}
        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-gray-500">
            More channels coming soon:{" "}
            <span className="text-gray-400">
              X (Twitter), Product Hunt, Hacker News, TikTok, Discord, Slack
              Communities
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
