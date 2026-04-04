"use client";

import { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Cpu,
  Copy,
  Check,
  TrendingUp,
  Clock,
  Target,
  Flame,
  ThumbsUp,
  Frown,
  MessageSquare
} from "lucide-react";
import type { ChannelStrategy } from "@/lib/types";
import { updatePostFeedback } from "@/app/playbook/actions";

function ChannelCard({ playbookId, channel }: { playbookId: string; channel: ChannelStrategy }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  
  // Local state for instant UI updates
  const [feedbackState, setFeedbackState] = useState<Record<number, { rating?: "fire"|"ok"|"flop", comments?: string }>>({});
  const timeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleRating = (idx: number, rating: "fire"|"ok"|"flop") => {
    setFeedbackState(prev => ({...prev, [idx]: { ...prev[idx], rating }}));
    updatePostFeedback(playbookId, channel.name, idx, rating, undefined).catch(console.error);
  };

  const handleCommentsChange = (idx: number, val: string) => {
    setFeedbackState(prev => ({...prev, [idx]: { ...prev[idx], comments: val }}));
    
    // Auto-save logic
    if (timeoutRefs.current[idx]) clearTimeout(timeoutRefs.current[idx]);
    timeoutRefs.current[idx] = setTimeout(() => {
      updatePostFeedback(playbookId, channel.name, idx, undefined, val).catch(console.error);
    }, 1000);
  };

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
        
        {/* Fit Score & Metrics (Hidden on small screens when collapsed) */}
        <div className={`mt-4 sm:mt-0 flex items-center gap-6 sm:ml-4`}>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
            <p className={`text-lg font-extrabold ${channel.pushType === 'hard' ? 'text-emerald-500' : 'text-gray-500'}`}>
              {channel.fitScore}%
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fit Score</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
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

            {/* 30-Day Content Timeline */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-6">
                30-Day Content Timeline
              </h4>
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pb-4">
                {channel.contentCalendar?.sort((a, b) => a.day - b.day).map((tmpl, i) => (
                  <div
                    key={i}
                    className="relative pl-8"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[11px] top-4 w-5 h-5 rounded-full bg-white border-4 border-blue-500 shadow-sm" />
                    
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      {/* Day Label */}
                      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-bl-2xl font-black text-sm shadow-sm pointer-events-none group-hover:bg-[#ff6b4e] group-hover:text-white transition-colors">
                        Day {tmpl.day}
                      </div>

                      <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4 pr-20">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#1a1a2e] text-white uppercase font-bold tracking-wider">
                            {tmpl.type}
                          </span>
                          <h5 className="text-base font-bold text-[#1a1a2e]">
                            {tmpl.title}
                          </h5>
                        </div>
                      </div>
                      
                      {/* Hook section */}
                      <div className="bg-[#ff6b4e]/5 rounded-xl px-5 py-4 mb-4 border-l-4 border-[#ff6b4e]">
                        <p className="text-sm text-[#ce4a2f] font-bold leading-relaxed">
                          {tmpl.hook}
                        </p>
                      </div>
                      
                      {/* Body section */}
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium mb-5">
                        {tmpl.body}
                      </p>

                      {/* Copy action */}
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleCopy(`${tmpl.hook}\n\n${tmpl.body}`, i)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 ${
                            copiedIdx === i
                              ? "bg-emerald-500 text-white shadow-emerald-500/20"
                              : "bg-gray-50 text-gray-600 hover:bg-[#1a1a2e] hover:text-white border border-gray-200 hover:border-[#1a1a2e]"
                          }`}
                        >
                          {copiedIdx === i ? (
                            <>
                              <Check className="w-4 h-4" /> Copied to Clipboard
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" /> Copy Post
                            </>
                          )}
                        </button>
                      </div>

                      {/* Performance Feedback Loop */}
                      <div className="mt-4 pt-4 border-t border-gray-100/50 bg-gray-50/50 -mx-6 -mb-6 px-6 pb-6 shadow-inner">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rate Performance</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRating(i, "fire")}
                              className={`p-2 rounded-lg transition-all ${
                                (feedbackState[i]?.rating || tmpl.feedbackRating) === "fire" 
                                ? "bg-orange-100 text-orange-500 scale-110 shadow-sm" 
                                : "text-gray-400 hover:bg-orange-50 hover:text-orange-400"
                              }`}
                              title="Killed It"
                            >
                              <Flame className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRating(i, "ok")}
                              className={`p-2 rounded-lg transition-all ${
                                (feedbackState[i]?.rating || tmpl.feedbackRating) === "ok" 
                                ? "bg-blue-100 text-blue-500 scale-110 shadow-sm" 
                                : "text-gray-400 hover:bg-blue-50 hover:text-blue-400"
                              }`}
                              title="Did Okay"
                            >
                              <ThumbsUp className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRating(i, "flop")}
                              className={`p-2 rounded-lg transition-all ${
                                (feedbackState[i]?.rating || tmpl.feedbackRating) === "flop" 
                                ? "bg-gray-200 text-gray-600 scale-110 shadow-sm" 
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                              }`}
                              title="Flopped"
                            >
                              <Frown className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Raw Comments Dropdown (Visible if rated) */}
                        {((feedbackState[i]?.rating || tmpl.feedbackRating) !== undefined) && (
                          <div className="animate-in slide-in-from-top-2 fade-in duration-200 mt-2">
                            <div className="relative">
                              <MessageSquare className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                              <textarea
                                value={feedbackState[i]?.comments !== undefined ? feedbackState[i]?.comments : (tmpl.feedbackComments || "")}
                                onChange={(e) => handleCommentsChange(i, e.target.value)}
                                placeholder="Paste the exact comments this got (or your raw thoughts) to train the AI for next time..."
                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/20 focus:border-[#ff6b4e]/40 transition-all resize-none h-20 shadow-sm"
                              />
                              <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-50">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auto-saving</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
          <ChannelCard key={ch.name} playbookId={playbookId} channel={ch} />
        ))}
    </div>
  );
}
