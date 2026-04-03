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
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a2e]">Who is it for?</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-11">
          This is entirely optional. Our AI will identify your ICP even if you skip this.
        </p>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Users className="w-4 h-4 text-gray-400" />
          Who do you think uses this?
          <span className="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={data.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          placeholder="e.g. Solo founders who just built their first SaaS product and don't know how to get their first users"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm resize-none shadow-sm"
        />
        <p className="text-xs text-gray-500 font-medium">
          Don&apos;t worry about being precise. Our AI will validate and refine this.
        </p>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Building2 className="w-4 h-4 text-gray-400" />
          Industry / Niche
          <span className="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() =>
                onChange({ industry: data.industry === ind ? "" : ind })
              }
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 text-left ${
                data.industry === ind
                  ? "bg-[#ff6b4e]/10 text-[#ff6b4e] border border-[#ff6b4e]/30 shadow-sm"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Skip hint */}
      <div className="flex items-center gap-3 bg-blue-50/50 rounded-xl px-4 py-3 border border-blue-100">
        <span className="text-lg">💡</span>
        <span className="text-xs text-blue-800 font-medium leading-relaxed">
          It&apos;s totally fine to leave these blank. Our AI will figure out your ideal customer profile from your product description.
        </span>
      </div>
    </div>
  );
}
