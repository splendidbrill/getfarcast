"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Cpu,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import type { ChannelStrategy } from "@/lib/types";

function ChannelCard({ channel }: { channel: ChannelStrategy }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-3xl border transition-all duration-300 ${expanded ? 'border-[#ff6b4e]/30 shadow-md shadow-[#ff6b4e]/5' : 'border-black/5 shadow-sm hover:border-black/10 hover:shadow-md'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-6 text-left"
      >
        <div className="flex items-start sm:items-center gap-4">
          <span
            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ${
              channel.pushType === "hard"
                ? "bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            #{channel.rank}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-[#1a1a2e]">{channel.name}</h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  channel.pushType === "hard"
                    ? "bg-[#ff6b4e]/10 text-[#ff6b4e]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {channel.pushType} push
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              {channel.rationale}
            </p>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-4 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
          {/* Agency Data Bar (The "Anti-Generic" row) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-b border-gray-200 bg-white">
            <div className="p-4 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expected CAC</p>
                <p className="text-xs font-semibold text-gray-900">{channel.cac || "Varies by campaign"}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time to ROI</p>
                <p className="text-xs font-semibold text-gray-900">{channel.timeToRoi || "Within 30 days"}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peak Posting Times</p>
                <p className="text-xs font-semibold text-gray-900">
                  {channel.bestPostingTimes ? channel.bestPostingTimes.join(", ") : "Check platform analytics"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Algorithm Insights */}
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Expert Algorithm Insights
                </h4>
              </div>
              <ul className="space-y-2">
                {channel.algorithmInsights.map((ins, i) => (
                  <li key={i} className="text-sm font-medium text-blue-800 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {ins}
                  </li>
                ))}
              </ul>
            </div>

            {/* Influencer Targets (If provided) */}
            {channel.influencerTargets && channel.influencerTargets.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                  Influencer / Community Targets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {channel.influencerTargets.map((inf, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-[#1a1a2e]">{inf.handle}</p>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                          {inf.audienceSize}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{inf.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Practices vs Anti-Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10" />
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What To Do
                </h4>
                <ul className="space-y-2.5">
                  {channel.bestPractices.map((bp, i) => (
                    <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10" />
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  What Kills Reach
                </h4>
                <ul className="space-y-2.5">
                  {channel.antiPatterns.map((ap, i) => (
                    <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                      <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                      {ap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export function PlaybookChannels({
  playbookId,
  channels,
}: {
  playbookId: string;
  channels: ChannelStrategy[];
}) {
  return (
    <div className="space-y-6">
      {channels
        .sort((a, b) => a.rank - b.rank)
        .map((ch) => (
          <ChannelCard key={ch.name} channel={ch} />
        ))}
    </div>
  );
}
