"use client";

import { DollarSign } from "lucide-react";
import type { WizardFormData, PricingModel } from "@/lib/types";

interface Props {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

const PRICING_OPTIONS: { value: PricingModel; label: string; desc: string; emoji: string }[] = [
  {
    value: "free",
    label: "Free",
    desc: "No charge. Free forever or open source.",
    emoji: "🆓",
  },
  {
    value: "freemium",
    label: "Freemium",
    desc: "Free tier with paid upgrades.",
    emoji: "⚡",
  },
  {
    value: "paid",
    label: "Paid",
    desc: "Paid from day one. Trial or direct purchase.",
    emoji: "💰",
  },
];

export function StepPricingInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white">How do you charge?</h2>
        </div>
        <p className="text-sm text-surface-200/50 mt-1 ml-11">
          This helps us tailor your outreach and positioning strategy.
        </p>
      </div>

      {/* Pricing model selection */}
      <div className="space-y-3">
        {PRICING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ pricingModel: opt.value })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
              data.pricingModel === opt.value
                ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                : "bg-white/[0.02] border-white/5 hover:border-white/15"
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <p
                className={`text-sm font-semibold ${
                  data.pricingModel === opt.value
                    ? "text-emerald-400"
                    : "text-white"
                }`}
              >
                {opt.label}
              </p>
              <p className="text-xs text-surface-200/40 mt-0.5">{opt.desc}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                data.pricingModel === opt.value
                  ? "border-emerald-400 bg-emerald-500"
                  : "border-white/20"
              }`}
            >
              {data.pricingModel === opt.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Price point - show for freemium and paid */}
      {data.pricingModel !== "free" && (
        <div className="space-y-2 animate-fade-in-up">
          <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
            <DollarSign className="w-3.5 h-3.5 text-surface-200/40" />
            Price point
            <span className="text-xs text-surface-200/30 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={data.pricePoint}
            onChange={(e) => onChange({ pricePoint: e.target.value })}
            placeholder="e.g. $20/month or $99 one-time"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-surface-200/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all text-sm"
          />
        </div>
      )}
    </div>
  );
}
