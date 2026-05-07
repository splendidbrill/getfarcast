"use client";

import {
  Users,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Heart,
  Briefcase,
  Zap,
} from "lucide-react";
import type { ICPProfile } from "@/lib/types";

const DISC_COLORS: Record<string, { bg: string; border: string, text: string; label: string }> = {
  D: { bg: "bg-red-50", border: "border-red-100", text: "text-red-600", label: "Dominance" },
  I: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600", label: "Influence" },
  S: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600", label: "Steadiness" },
  C: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-600", label: "Conscientiousness" },
};

export function PlaybookICP({ icp }: { icp: ICPProfile }) {
  const discProfile = icp?.discProfile ?? { primaryType: "D", secondaryType: "I", description: "", communicationStyle: "", motivators: [], stressors: [] };
  const demographics = icp?.demographics ?? { ageRange: "", gender: "", location: "", incomeRange: "", education: "", jobTitles: [] };
  const psychographics = icp?.psychographics ?? { values: [], personalityTraits: [], frustrations: [], spendingHabits: [], interests: [], stressors: [] };
  const buyingTriggers = icp?.buyingTriggers ?? [];
  const currentAlternatives = icp?.currentAlternatives ?? [];

  const primary = DISC_COLORS[discProfile.primaryType] || DISC_COLORS.D;
  const secondary = DISC_COLORS[discProfile.secondaryType] || DISC_COLORS.I;

  return (
    <div className="space-y-8">
      {/* ICP Header */}
      <div className="bg-gradient-to-br from-blue-50 to-transparent rounded-3xl p-6 sm:p-8 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a2e]">{icp?.title}</h2>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed font-medium">
              {icp?.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Demographics + Psychographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demographics */}
        <div className="rounded-2xl border border-black/5 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Demographics
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Age Range", value: demographics.ageRange },
              { label: "Gender", value: demographics.gender },
              { label: "Location", value: demographics.location },
              { label: "Income", value: demographics.incomeRange },
              { label: "Education", value: demographics.education },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs font-medium text-gray-500">{row.label}</span>
                <span className="text-sm font-semibold text-[#1a1a2e] text-right max-w-[60%]">
                  {row.value}
                </span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs font-medium text-gray-500 mb-2">Likely Job Titles</p>
              <div className="flex flex-wrap gap-2">
                {(demographics.jobTitles ?? []).map((jt) => (
                  <span
                    key={jt}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium"
                  >
                    {jt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Psychographics */}
        <div className="rounded-2xl border border-black/5 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-4 h-4 text-[#ff6b4e]" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Psychographics
            </h3>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Core Values & Traits</p>
              <div className="flex flex-wrap gap-2">
                {(psychographics.values ?? []).concat(psychographics.personalityTraits ?? []).map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            
            {psychographics.spendingHabits?.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="text-emerald-500">$</span> Spending Habits
                </p>
                <ul className="space-y-1.5">
                  {psychographics.spendingHabits.map((sh, i) => (
                    <li key={i} className="text-xs font-medium text-emerald-800 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span> {sh}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Key Frustrations</p>
              <ul className="space-y-2">
                {(psychographics.frustrations ?? []).map((f, i) => (
                  <li
                    key={i}
                    className="text-xs font-medium text-gray-700 flex items-start gap-2 bg-red-50/50 p-2 rounded-lg border border-red-100/50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DISC Profile */}
      <div className="rounded-2xl border border-black/5 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-5">
          <Brain className="w-4 h-4 text-purple-500" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Psychological Profile (DISC)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className={`${primary.bg} ${primary.border} border rounded-2xl p-5`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Primary Motivation</p>
            <p className={`text-2xl font-extrabold ${primary.text}`}>
              {discProfile.primaryType} — {primary.label}
            </p>
          </div>
          <div className={`${secondary.bg} ${secondary.border} border rounded-2xl p-5`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Secondary Motivation</p>
            <p className={`text-2xl font-extrabold ${secondary.text}`}>
              {discProfile.secondaryType} — {secondary.label}
            </p>
          </div>
        </div>
        <div className="space-y-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div>
            <p className="text-xs font-bold text-gray-900 mb-1">How they think</p>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {discProfile.description}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 mb-1">
              How to communicate with them
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {discProfile.communicationStyle}
            </p>
          </div>
        </div>
      </div>

      {/* Buying Triggers + Alternatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Buying Triggers (Why they buy NOW)
            </h3>
          </div>
          <ul className="space-y-3">
            {buyingTriggers.map((t, i) => (
              <li
                key={i}
                className="text-sm font-medium text-amber-800 flex items-start gap-2 bg-white rounded-xl p-3 border border-amber-100 shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 fill-amber-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Competitor Weaknesses
            </h3>
          </div>
          <div className="space-y-3">
            {currentAlternatives.map((alt, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <p className="text-sm font-bold text-[#1a1a2e] mb-1">{alt.name}</p>
                <p className="text-xs font-medium text-gray-600">
                  <span className="text-red-500 font-semibold mb-1 block">Why it falls short:</span>
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
