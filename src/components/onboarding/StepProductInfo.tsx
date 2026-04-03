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
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a2e]">Tell us what you built</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-11">
          The more specific you are, the better your playbook will be.
        </p>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <FileText className="w-4 h-4 text-gray-400" />
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          placeholder="e.g. GetFarcast"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm shadow-sm"
        />
      </div>

      {/* Product URL */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Globe className="w-4 h-4 text-gray-400" />
          Product URL
          <span className="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={data.productUrl}
          onChange={(e) => onChange({ productUrl: e.target.value })}
          placeholder="https://yourproduct.com"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm shadow-sm"
        />
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          What does it do? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.productDescription}
          onChange={(e) => onChange({ productDescription: e.target.value })}
          placeholder="Describe your product in 2-3 sentences. What is it? What does it help people do?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm resize-none shadow-sm"
        />
      </div>

      {/* Problem It Solves */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Lightbulb className="w-4 h-4 text-gray-400" />
          What problem does it solve?
        </label>
        <textarea
          value={data.problemItSolves}
          onChange={(e) => onChange({ problemItSolves: e.target.value })}
          placeholder="What pain point or frustration does your product solve? Be specific."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm resize-none shadow-sm"
        />
      </div>
    </div>
  );
}
