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
          <div className="w-8 h-8 rounded-lg bg-[#ff6b4e]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#ff6b4e]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a2e]">What&apos;s your goal?</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-11">
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
                ? "bg-[#ff6b4e]/5 border-[#ff6b4e]/30 shadow-sm"
                : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <span className="text-2xl">{goal.emoji}</span>
            <div className="flex-1">
              <p
                className={`text-sm font-bold ${
                  data.primaryGoal === goal.value
                    ? "text-[#ce4a2f]"
                    : "text-[#1a1a2e]"
                }`}
              >
                {goal.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{goal.desc}</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                data.primaryGoal === goal.value
                  ? "border-[#ff6b4e] bg-[#ff6b4e]"
                  : "border-gray-200 bg-white"
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
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          Timeline
        </label>
        <div className="flex gap-3">
          {TIMELINES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ timeline: t.value })}
              className={`flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                data.timeline === t.value
                  ? "bg-[#1a1a2e] text-white shadow-md border border-[#1a1a2e]"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Final note */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#ff6b4e]/10 to-[#ff8c5a]/10 rounded-xl px-4 py-3 border border-[#ff6b4e]/20">
        <span className="text-xl">✨</span>
        <p className="text-xs text-gray-700 font-medium leading-relaxed">
          Almost there! Hit{" "}
          <span className="text-[#ff6b4e] font-bold">Generate My Playbook</span>{" "}
          and our AI will craft a complete growth strategy in under 2 minutes.
        </p>
      </div>
    </div>
  );
}
