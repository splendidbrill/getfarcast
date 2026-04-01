"use client";

import {
  Users,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Heart,
  Briefcase,
} from "lucide-react";
import type { ICPProfile } from "@/lib/types";

const DISC_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  D: { bg: "bg-red-500/10", text: "text-red-400", label: "Dominance" },
  I: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Influence" },
  S: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Steadiness" },
  C: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Conscientiousness" },
};

export function PlaybookICP({ icp }: { icp: ICPProfile }) {
  const primary = DISC_COLORS[icp.discProfile.primaryType] || DISC_COLORS.D;
  const secondary = DISC_COLORS[icp.discProfile.secondaryType] || DISC_COLORS.I;

  return (
    <div className="space-y-8">
      {/* ICP Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{icp.title}</h2>
            <p className="text-sm text-surface-200/50 mt-1 leading-relaxed">
              {icp.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Demographics + Psychographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider">
              Demographics
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Age Range", value: icp.demographics.ageRange },
              { label: "Gender", value: icp.demographics.gender },
              { label: "Location", value: icp.demographics.location },
              { label: "Income", value: icp.demographics.incomeRange },
              { label: "Education", value: icp.demographics.education },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-xs text-surface-200/40">{row.label}</span>
                <span className="text-sm font-medium text-white text-right max-w-[60%]">
                  {row.value}
                </span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-surface-200/40 mb-2">Job Titles</p>
              <div className="flex flex-wrap gap-1.5">
                {icp.demographics.jobTitles.map((jt) => (
                  <span
                    key={jt}
                    className="px-2 py-1 rounded-md bg-brand-500/10 text-brand-400 text-xs"
                  >
                    {jt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Psychographics */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-4 h-4 text-accent-400" />
            <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider">
              Psychographics
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-surface-200/40 mb-2">Personality Traits</p>
              <div className="flex flex-wrap gap-1.5">
                {icp.psychographics.personalityTraits.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 rounded-md bg-accent-500/10 text-accent-400 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-200/40 mb-2">Values</p>
              <div className="flex flex-wrap gap-1.5">
                {icp.psychographics.values.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-200/40 mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {icp.psychographics.interests.map((i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-200/40 mb-2">Frustrations</p>
              <ul className="space-y-1">
                {icp.psychographics.frustrations.map((f, i) => (
                  <li
                    key={i}
                    className="text-xs text-surface-200/60 flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DISC Profile */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Brain className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider">
            DISC Personality Profile
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className={`${primary.bg} rounded-xl p-4 border border-white/5`}>
            <p className="text-xs text-surface-200/40 mb-1">Primary Type</p>
            <p className={`text-2xl font-extrabold ${primary.text}`}>
              {icp.discProfile.primaryType} — {primary.label}
            </p>
          </div>
          <div className={`${secondary.bg} rounded-xl p-4 border border-white/5`}>
            <p className="text-xs text-surface-200/40 mb-1">Secondary Type</p>
            <p className={`text-2xl font-extrabold ${secondary.text}`}>
              {icp.discProfile.secondaryType} — {secondary.label}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-surface-200/40 mb-1">Description</p>
            <p className="text-sm text-surface-200/70 leading-relaxed">
              {icp.discProfile.description}
            </p>
          </div>
          <div>
            <p className="text-xs text-surface-200/40 mb-1">
              Communication Style
            </p>
            <p className="text-sm text-surface-200/70 leading-relaxed">
              {icp.discProfile.communicationStyle}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-emerald-400 mb-2 font-medium">
                ✅ Motivators
              </p>
              <ul className="space-y-1">
                {icp.discProfile.motivators.map((m, i) => (
                  <li key={i} className="text-xs text-surface-200/60">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-red-400 mb-2 font-medium">
                ⚠️ Stressors
              </p>
              <ul className="space-y-1">
                {icp.discProfile.stressors.map((s, i) => (
                  <li key={i} className="text-xs text-surface-200/60">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Buying Triggers + Pain Points + Alternatives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buying Triggers */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider">
              Buying Triggers
            </h3>
          </div>
          <ul className="space-y-2">
            {icp.buyingTriggers.map((t, i) => (
              <li
                key={i}
                className="text-xs text-surface-200/60 flex items-start gap-2"
              >
                <span className="text-amber-400 mt-0.5">⚡</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Pain Points */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider">
              Pain Points
            </h3>
          </div>
          <ul className="space-y-2">
            {icp.painPoints.map((p, i) => (
              <li
                key={i}
                className="text-xs text-surface-200/60 flex items-start gap-2"
              >
                <span className="text-red-400 mt-0.5">🔥</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Current Alternatives */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-surface-200/60 uppercase tracking-wider">
              Alternatives
            </h3>
          </div>
          <div className="space-y-3">
            {icp.currentAlternatives.map((alt, i) => (
              <div
                key={i}
                className="bg-white/[0.02] rounded-lg p-3 border border-white/5"
              >
                <p className="text-xs font-semibold text-white">{alt.name}</p>
                <p className="text-xs text-surface-200/40 mt-0.5">
                  {alt.weakness}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
