"use client";

import { Target, Clock } from "lucide-react";
import type { WizardFormData, GoalType, Timeline } from "@/lib/types";

interface Props {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

const GOALS: { value: GoalType; label: string; desc: string; emoji: string }[] = [
  {
    value: "first-100",
    label: "Get First 100 Users",
    desc: "You just launched and need traction from zero.",
    emoji: "🚀",
  },
  {
    value: "launch",
    label: "Product Launch Buzz",
    desc: "Maximize visibility for an upcoming launch.",
    emoji: "📣",
  },
  {
    value: "scale",
    label: "Scale Existing Growth",
    desc: "You have some users, now you need distribution channels.",
    emoji: "📈",
  },
];

const TIMELINES: { value: Timeline; label: string }[] = [
  { value: "2-weeks", label: "2 weeks" },
  { value: "1-month", label: "1 month" },
  { value: "3-months", label: "3 months" },
];

export function StepGoalInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-white">What&apos;s your goal?</h2>
        </div>
        <p className="text-sm text-surface-200/50 mt-1 ml-11">
          This shapes the urgency and strategy of your playbook.
        </p>
      </div>

      {/* Goal selection */}
      <div className="space-y-3">
        {GOALS.map((goal) => (
          <button
            key={goal.value}
            type="button"
            onClick={() => onChange({ primaryGoal: goal.value })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
              data.primaryGoal === goal.value
                ? "bg-brand-500/10 border-brand-500/30 shadow-lg shadow-brand-500/5"
                : "bg-white/[0.02] border-white/5 hover:border-white/15"
            }`}
          >
            <span className="text-2xl">{goal.emoji}</span>
            <div className="flex-1">
              <p
                className={`text-sm font-semibold ${
                  data.primaryGoal === goal.value
                    ? "text-brand-400"
                    : "text-white"
                }`}
              >
                {goal.label}
              </p>
              <p className="text-xs text-surface-200/40 mt-0.5">{goal.desc}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                data.primaryGoal === goal.value
                  ? "border-brand-400 bg-brand-500"
                  : "border-white/20"
              }`}
            >
              {data.primaryGoal === goal.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-surface-200/80">
          <Clock className="w-3.5 h-3.5 text-surface-200/40" />
          Timeline
        </label>
        <div className="flex gap-3">
          {TIMELINES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ timeline: t.value })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium text-center transition-all duration-200 ${
                data.timeline === t.value
                  ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg"
                  : "bg-white/[0.03] text-surface-200/50 border border-white/5 hover:border-white/15 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Final note */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-brand-500/5 to-accent-500/5 rounded-xl px-4 py-3 border border-brand-500/10">
        <span className="text-xl">✨</span>
        <p className="text-xs text-surface-200/60">
          Almost there! Hit{" "}
          <span className="text-brand-400 font-semibold">Generate My Playbook</span>{" "}
          and our AI will craft a complete growth strategy in under 2 minutes.
        </p>
      </div>
    </div>
  );
}
