"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  BarChart3,
  Sparkles,
} from "lucide-react";
import type { Playbook } from "@/lib/types";

export function PlaybookOverview({ playbook }: { playbook: Playbook }) {
  const marketSizing = playbook.marketSizing ?? {};
  const icp = playbook.icp ?? {};
  const channels = playbook.channels ?? [];
  const trendIcon =
    marketSizing.trendDirection === "growing" ? (
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    ) : marketSizing.trendDirection === "declining" ? (
      <TrendingDown className="w-4 h-4 text-red-500" />
    ) : (
      <Minus className="w-4 h-4 text-amber-500" />
    );

  const trendColor =
    marketSizing.trendDirection === "growing"
      ? "text-emerald-600"
      : marketSizing.trendDirection === "declining"
        ? "text-red-600"
        : "text-amber-600";

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-[#ff6b4e]/5 to-transparent rounded-3xl p-6 sm:p-8 border border-[#ff6b4e]/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a2e]">Executive Summary</h2>
            <p className="text-xs text-gray-500 font-medium">
              Your playbook at a glance
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          {playbook.summary || (playbook as any).description || "No summary available — try regenerating this playbook."}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Users className="w-5 h-5 text-blue-500 mx-auto mb-2" />,
            val: icp.title?.split(",")[0] ?? "—",
            label: "Primary ICP",
            bg: "bg-blue-50",
          },
          {
            icon: <Target className="w-5 h-5 text-[#ff6b4e] mx-auto mb-2" />,
            val: channels.length,
            label: "Channels Mapped",
            bg: "bg-[#ff6b4e]/10",
          },
          {
            icon: <BarChart3 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />,
            val: channels.reduce((sum, c) => sum + (c.contentCalendar?.length ?? 0), 0),
            label: "Content Templates",
            bg: "bg-emerald-50",
          },
          {
            icon: trendIcon,
            val: marketSizing.trendDirection,
            label: "Market Trend",
            bg: "bg-gray-50",
            valClass: `capitalize ${trendColor}`,
          },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-center border ${s.bg.includes('bg-') ? s.bg.replace('bg-', 'border-') : 'border-black/5'} ${s.bg}`}>
            {s.icon}
            <p className={`text-xl font-extrabold text-[#1a1a2e] mt-1 ${s.valClass || ""}`}>
              {s.val}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Market Sizing */}
      <div>
        <h3 className="text-sm font-bold text-[#1a1a2e] mb-4">Market Sizing Estimation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: "TAM (Total)", value: marketSizing.tam, color: "blue" },
            { label: "SAM (Serviceable)", value: marketSizing.sam, color: "purple" },
            { label: "SOM (Obtainable)", value: marketSizing.som, color: "emerald" },
          ].map((m) => (
            <div
              key={m.label}
              className={`bg-${m.color}-50 rounded-2xl p-4 border border-${m.color}-100`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 text-${m.color}-600`}>
                {m.label}
              </p>
              <p className="text-sm font-semibold text-[#1a1a2e]">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div className="mt-0.5">{trendIcon}</div>
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className={`font-bold ${trendColor} capitalize`}>
              {marketSizing.trendDirection}
            </span>{" "}
            — {marketSizing.trendRationale}
          </p>
        </div>
      </div>
    </div>
  );
}
