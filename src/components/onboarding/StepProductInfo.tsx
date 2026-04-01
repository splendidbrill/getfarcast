"use client";

import { MessageSquare, Globe, FileText, Lightbulb } from "lucide-react";
import type { WizardFormData } from "@/lib/types";

interface Props {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function StepProductInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Tell us what you built</h2>
        </div>
        <p className="text-sm text-surface-200/50 mt-1 ml-11">
          The more specific you are, the better your playbook will be.
        </p>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <FileText className="w-3.5 h-3.5 text-surface-200/40" />
          Product Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          placeholder="e.g. GetFarcast"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-surface-200/25 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all text-sm"
        />
      </div>

      {/* Product URL */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <Globe className="w-3.5 h-3.5 text-surface-200/40" />
          Product URL
          <span className="text-xs text-surface-200/30 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={data.productUrl}
          onChange={(e) => onChange({ productUrl: e.target.value })}
          placeholder="https://yourproduct.com"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-surface-200/25 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all text-sm"
        />
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <MessageSquare className="w-3.5 h-3.5 text-surface-200/40" />
          What does it do? <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.productDescription}
          onChange={(e) => onChange({ productDescription: e.target.value })}
          placeholder="Describe your product in 2-3 sentences. What is it? What does it help people do?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-surface-200/25 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all text-sm resize-none"
        />
      </div>

      {/* Problem It Solves */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <Lightbulb className="w-3.5 h-3.5 text-surface-200/40" />
          What problem does it solve?
        </label>
        <textarea
          value={data.problemItSolves}
          onChange={(e) => onChange({ problemItSolves: e.target.value })}
          placeholder="What pain point or frustration does your product solve? Be specific."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-surface-200/25 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all text-sm resize-none"
        />
      </div>
    </div>
  );
}
