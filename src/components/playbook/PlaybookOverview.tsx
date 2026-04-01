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
  const trendIcon =
    playbook.marketSizing.trendDirection === "growing" ? (
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    ) : playbook.marketSizing.trendDirection === "declining" ? (
      <TrendingDown className="w-4 h-4 text-red-400" />
    ) : (
      <Minus className="w-4 h-4 text-amber-400" />
    );

  const trendColor =
    playbook.marketSizing.trendDirection === "growing"
      ? "text-emerald-400"
      : playbook.marketSizing.trendDirection === "declining"
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Executive Summary</h2>
            <p className="text-xs text-surface-200/40">
              Your playbook at a glance
            </p>
          </div>
        </div>
        <p className="text-sm text-surface-200/70 leading-relaxed">
          {playbook.summary}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 text-center">
          <Users className="w-5 h-5 text-brand-400 mx-auto mb-2" />
          <p className="text-xl font-extrabold text-white">
            {playbook.icp.title.split(",")[0]}
          </p>
          <p className="text-xs text-surface-200/40 mt-1">Primary ICP</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <Target className="w-5 h-5 text-accent-400 mx-auto mb-2" />
          <p className="text-xl font-extrabold text-white">
            {playbook.channels.length}
          </p>
          <p className="text-xs text-surface-200/40 mt-1">Channels Mapped</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          <BarChart3 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-xl font-extrabold text-white">
            {playbook.channels.reduce(
              (sum, c) => sum + c.contentTemplates.length,
              0
            )}
          </p>
          <p className="text-xs text-surface-200/40 mt-1">Content Templates</p>
        </div>
        <div className="glass-card rounded-xl p-5 text-center">
          {trendIcon}
          <p className={`text-xl font-extrabold mt-2 capitalize ${trendColor}`}>
            {playbook.marketSizing.trendDirection}
          </p>
          <p className="text-xs text-surface-200/40 mt-1">Market Trend</p>
        </div>
      </div>

      {/* ICP Snapshot + Top Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ICP Snapshot */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider mb-4">
            ICP Snapshot
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-bold text-white">{playbook.icp.title}</p>
              <p className="text-xs text-surface-200/50 mt-1">
                {playbook.icp.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 text-xs font-medium">
                DISC: {playbook.icp.discProfile.primaryType}
                {playbook.icp.discProfile.secondaryType}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-accent-500/10 text-accent-400 text-xs font-medium">
                {playbook.icp.demographics.ageRange}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                {playbook.icp.demographics.incomeRange}
              </span>
            </div>
            <div className="pt-2">
              <p className="text-xs text-surface-200/40 mb-2">Top Pain Points</p>
              <ul className="space-y-1">
                {playbook.icp.painPoints.slice(0, 3).map((p, i) => (
                  <li
                    key={i}
                    className="text-xs text-surface-200/60 flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-0.5">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Top Channels */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider mb-4">
            Top Channels
          </h3>
          <div className="space-y-4">
            {playbook.channels
              .sort((a, b) => a.rank - b.rank)
              .slice(0, 5)
              .map((ch) => (
                <div key={ch.name} className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      ch.pushType === "hard"
                        ? "bg-brand-500/20 text-brand-400"
                        : "bg-white/5 text-surface-200/40"
                    }`}
                  >
                    #{ch.rank}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white">
                        {ch.name}
                      </p>
                      <span className="text-xs text-surface-200/40">
                        {ch.fitScore}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-700"
                        style={{ width: `${ch.fitScore}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      ch.pushType === "hard"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/5 text-surface-200/40"
                    }`}
                  >
                    {ch.pushType}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Market Sizing */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider mb-4">
          Market Sizing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { label: "TAM", value: playbook.marketSizing.tam, color: "brand" },
            { label: "SAM", value: playbook.marketSizing.sam, color: "accent" },
            { label: "SOM", value: playbook.marketSizing.som, color: "emerald" },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center"
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider mb-1 text-${m.color}-400`}
              >
                {m.label}
              </p>
              <p className="text-sm font-semibold text-white">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-white/[0.02] rounded-lg px-4 py-3">
          {trendIcon}
          <p className="text-xs text-surface-200/50">
            <span className={`font-semibold ${trendColor} capitalize`}>
              {playbook.marketSizing.trendDirection}
            </span>{" "}
            — {playbook.marketSizing.trendRationale}
          </p>
        </div>
      </div>
    </div>
  );
}
