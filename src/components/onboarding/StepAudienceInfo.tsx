"use client";

import { Users, Building2 } from "lucide-react";
import type { WizardFormData } from "@/lib/types";

interface Props {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

const INDUSTRIES = [
  "SaaS / Software",
  "Developer Tools",
  "AI / Machine Learning",
  "E-Commerce / D2C",
  "FinTech",
  "EdTech",
  "HealthTech",
  "Creator Economy",
  "Marketplace",
  "Productivity",
  "Social / Community",
  "Other",
];

export function StepAudienceInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-accent-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Who is it for?</h2>
        </div>
        <p className="text-sm text-surface-200/50 mt-1 ml-11">
          This is entirely optional. Our AI will identify your ICP even if you skip this.
        </p>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <Users className="w-3.5 h-3.5 text-surface-200/40" />
          Who do you think uses this?
          <span className="text-xs text-surface-200/30 font-normal">(optional)</span>
        </label>
        <textarea
          value={data.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          placeholder="e.g. Solo founders who just built their first SaaS product and don't know how to get their first users"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-surface-200/25 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all text-sm resize-none"
        />
        <p className="text-xs text-surface-200/30">
          Don&apos;t worry about being precise. Our AI will validate and refine this.
        </p>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <Building2 className="w-3.5 h-3.5 text-surface-200/40" />
          Industry / Niche
          <span className="text-xs text-surface-200/30 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() =>
                onChange({ industry: data.industry === ind ? "" : ind })
              }
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-left ${
                data.industry === ind
                  ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                  : "bg-white/[0.03] text-surface-200/50 border border-white/5 hover:border-white/15 hover:text-white"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Skip hint */}
      <div className="flex items-center gap-2 text-xs text-surface-200/30 bg-white/[0.02] rounded-lg px-4 py-3 border border-white/5">
        <span className="text-lg">💡</span>
        <span>
          It&apos;s totally fine to leave these blank. Our AI will figure out your ideal customer profile from your product description.
        </span>
      </div>
    </div>
  );
}
