"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Cpu,
  Copy,
  Check,
} from "lucide-react";
import type { ChannelStrategy } from "@/lib/types";

function ChannelCard({ channel }: { channel: ChannelStrategy }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
              channel.pushType === "hard"
                ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                : "bg-white/5 text-surface-200/50"
            }`}
          >
            #{channel.rank}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{channel.name}</h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  channel.pushType === "hard"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/5 text-surface-200/40"
                }`}
              >
                {channel.pushType} push
              </span>
              <span
                className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                  channel.accessibility === "free"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : channel.accessibility === "freemium"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                }`}
              >
                {channel.accessibility}
              </span>
            </div>
            <p className="text-xs text-surface-200/40 mt-0.5">
              {channel.rationale}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">{channel.fitScore}%</p>
            <p className="text-[10px] text-surface-200/30">Fit Score</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-surface-200/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-surface-200/40" />
          )}
        </div>
      </button>

      {/* Fit Score Bar */}
      <div className="px-6 pb-2">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-700"
            style={{ width: `${channel.fitScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-surface-200/30">
          <span>Audience: {channel.audienceSize}</span>
          <span>Engagement: {channel.engagementRate}</span>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6">
          {/* Algorithm Insights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-3.5 h-3.5 text-brand-400" />
              <h4 className="text-xs font-semibold text-surface-200/60 uppercase tracking-wider">
                Algorithm Insights
              </h4>
            </div>
            <ul className="space-y-1.5">
              {channel.algorithmInsights.map((ins, i) => (
                <li
                  key={i}
                  className="text-xs text-surface-200/60 flex items-start gap-2"
                >
                  <span className="text-brand-400 mt-0.5">💡</span>
                  {ins}
                </li>
              ))}
            </ul>
          </div>

          {/* Best Practices vs Anti-Patterns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Best Practices
              </h4>
              <ul className="space-y-1.5">
                {channel.bestPractices.map((bp, i) => (
                  <li
                    key={i}
                    className="text-xs text-surface-200/60 flex items-start gap-2"
                  >
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {bp}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Anti-Patterns
              </h4>
              <ul className="space-y-1.5">
                {channel.antiPatterns.map((ap, i) => (
                  <li
                    key={i}
                    className="text-xs text-surface-200/60 flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-0.5">✗</span>
                    {ap}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Templates */}
          <div>
            <h4 className="text-xs font-semibold text-surface-200/60 uppercase tracking-wider mb-3">
              Ready-to-Post Content
            </h4>
            <div className="space-y-4">
              {channel.contentTemplates.map((tmpl, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] rounded-xl p-4 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-accent-500/10 text-accent-400 uppercase font-bold">
                        {tmpl.type}
                      </span>
                      <h5 className="text-sm font-semibold text-white">
                        {tmpl.title}
                      </h5>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(`${tmpl.hook}\n\n${tmpl.body}`, i)
                      }
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-surface-200/40 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                    >
                      {copiedIdx === i ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-brand-500/5 rounded-lg px-3 py-2 mb-2 border-l-2 border-brand-500/30">
                    <p className="text-xs text-brand-400 font-medium">
                      Hook: {tmpl.hook}
                    </p>
                  </div>
                  <p className="text-xs text-surface-200/60 leading-relaxed whitespace-pre-wrap">
                    {tmpl.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaybookChannels({
  channels,
}: {
  channels: ChannelStrategy[];
}) {
  return (
    <div className="space-y-4">
      {channels
        .sort((a, b) => a.rank - b.rank)
        .map((ch) => (
          <ChannelCard key={ch.name} channel={ch} />
        ))}
    </div>
  );
}
