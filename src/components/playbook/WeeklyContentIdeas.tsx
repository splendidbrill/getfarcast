"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, Check, Loader2, Video, Lightbulb, Zap, Monitor,
  RefreshCw, UserCheck, ChevronLeft, ChevronRight, ArrowLeft,
} from "lucide-react";
import type { Playbook } from "@/lib/types";

interface ContentIdea {
  channelName: string;
  video_title: string;
  concept: string;
  hook: string;
  format: string;
  why_this_works: string;
  personalisation_tip?: string;
}

interface Props {
  playbook: Playbook;
}

const TIER_2_NAMES = ["youtube", "instagram", "tiktok"];

function isTier2(name: string) {
  return TIER_2_NAMES.some((t) => name.toLowerCase().includes(t));
}

function buildIcpSummary(playbook: Playbook) {
  const icp = playbook.icp;
  return `${icp.title}. ${icp.summary} Pain points: ${icp.painPoints.slice(0, 3).join(", ")}.`;
}

function storageKey(playbookId: string, date: string) {
  return `tier2_ideas_${playbookId}_${date}`;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayStr() {
  const d = new Date();
  return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── Idea Card ────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onRegenerate, regenerating, readOnly }: {
  idea: ContentIdea;
  onRegenerate: (channelName: string) => void;
  regenerating: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1a1a2e]">{idea.channelName}</h3>
        {!readOnly && (
          <button
            onClick={() => onRegenerate(idea.channelName)}
            disabled={regenerating}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
          <Video className="w-3.5 h-3.5" />
          Title
        </div>
        <p className="text-sm font-semibold text-[#1a1a2e]">{idea.video_title}</p>
      </div>

      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
          <Monitor className="w-3 h-3" />
          {idea.format}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Concept</p>
        <p className="text-sm text-gray-700 leading-relaxed">{idea.concept}</p>
      </div>

      <div className="space-y-1 bg-white rounded-xl p-3 border border-purple-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
          <Zap className="w-3.5 h-3.5" />
          Opening Hook
        </div>
        <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{idea.hook}&rdquo;</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <Lightbulb className="w-3.5 h-3.5" />
          Why This Works
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{idea.why_this_works}</p>
      </div>

      {idea.personalisation_tip && (
        <div className="space-y-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <UserCheck className="w-3.5 h-3.5" />
            Make It Personal
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">{idea.personalisation_tip}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function WeeklyContentIdeas({ playbook }: Props) {
  const tier2Channels = playbook.channels.filter((c) => isTier2(c.name));

  const today = todayStr();
  const now = new Date();

  const [view, setView] = useState<"calendar" | "content">("calendar");
  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [datesWithContent, setDatesWithContent] = useState<Set<string>>(new Set());

  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    tier2Channels.map((c) => c.name)
  );
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [regeneratingChannel, setRegeneratingChannel] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const dates = new Set<string>();
    const prefix = `tier2_ideas_${playbook.id}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const date = key.slice(prefix.length);
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) dates.add(date);
      }
    }
    setDatesWithContent(dates);
  }, [playbook.id]);

  const openDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const saved = localStorage.getItem(storageKey(playbook.id, dateStr));
    setIdeas(saved ? JSON.parse(saved) : []);
    setSelectedChannels(tier2Channels.map((c) => c.name));
    setError("");
    setView("content");
  };

  const callAPI = async (channels: string[]): Promise<ContentIdea[]> => {
    const res = await fetch("/api/generate-content-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedChannels: channels,
        productName: playbook.productName,
        productDescription: (playbook as any).productDescription || playbook.summary,
        icpSummary: buildIcpSummary(playbook),
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Generation failed");
    }
    const data = await res.json();
    return data.ideas as ContentIdea[];
  };

  const handleGenerate = async () => {
    if (selectedChannels.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const newIdeas = await callAPI(selectedChannels);
      setIdeas(newIdeas);
      localStorage.setItem(storageKey(playbook.id, selectedDate), JSON.stringify(newIdeas));
      setDatesWithContent((prev) => new Set([...prev, selectedDate]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (channelName: string) => {
    setRegeneratingChannel(channelName);
    setError("");
    try {
      const fresh = await callAPI([channelName]);
      const updated = ideas.map((i) => (i.channelName === channelName ? fresh[0] : i));
      if (!updated.find((i) => i.channelName === channelName)) updated.push(fresh[0]);
      setIdeas(updated);
      localStorage.setItem(storageKey(playbook.id, selectedDate), JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegeneratingChannel(null);
    }
  };

  const toggleChannel = (name: string) => {
    setSelectedChannels((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  // ── Calendar ──────────────────────────────────────────────────────────────

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthName = new Date(calYear, calMonth).toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const isToday = (d: string) => d === today;
  const isPast = (d: string) => d < today;
  const isFuture = (d: string) => d > today;
  const hasContent = (d: string) => datesWithContent.has(d);

  const getDayClass = (dateStr: string) => {
    if (hasContent(dateStr)) {
      return "bg-purple-600 text-white font-bold cursor-pointer hover:bg-purple-700";
    }
    if (isToday(dateStr)) {
      return "bg-[#1a1a2e] text-white font-bold cursor-pointer hover:bg-[#2a2a3e]";
    }
    if (isPast(dateStr)) {
      return "text-gray-300 cursor-not-allowed";
    }
    if (isFuture(dateStr)) {
      return "text-gray-300 cursor-not-allowed";
    }
    return "text-gray-400";
  };

  const canClick = (dateStr: string) => isToday(dateStr) || hasContent(dateStr);

  if (tier2Channels.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-medium text-gray-500">
          No Tier 2 channels (YouTube, Instagram, TikTok) found in your playbook.
        </p>
        <p className="text-xs text-gray-400">
          These channels may not have been a strong fit for your product profile.
        </p>
      </div>
    );
  }

  // ── Calendar View ─────────────────────────────────────────────────────────

  if (view === "calendar") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Weekly Content Ideas</h2>
          <p className="text-sm text-gray-500">
            Pick a date to generate video ideas for that day. Purple dates have ideas ready.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm max-w-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-bold text-[#1a1a2e]">{monthName} {calYear}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = formatDate(calYear, calMonth, day);
              const clickable = canClick(dateStr);
              return (
                <button
                  key={day}
                  onClick={() => clickable && openDate(dateStr)}
                  disabled={!clickable}
                  className={`mx-auto w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all ${getDayClass(dateStr)}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1a1a2e]" /> Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600" /> Ideas generated
          </span>
        </div>
      </div>
    );
  }

  // ── Content View ──────────────────────────────────────────────────────────

  const isPastDate = selectedDate < today;
  const readOnly = isPastDate;

  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Back + heading */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("calendar")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1a1a2e] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Calendar
        </button>
        <span className="text-gray-200">/</span>
        <span className="text-sm font-bold text-[#1a1a2e]">{displayDate}</span>
        {readOnly && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
            View only
          </span>
        )}
      </div>

      {/* Channel selection — only shown when not read-only */}
      {!readOnly && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Channels</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tier2Channels.map((ch) => {
              const isSelected = selectedChannels.includes(ch.name);
              return (
                <button
                  key={ch.name}
                  onClick={() => toggleChannel(ch.name)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? "text-purple-700" : "text-gray-800"}`}>
                      {ch.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{ch.fitScore}% match</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate button */}
      {!readOnly && (
        <button
          onClick={handleGenerate}
          disabled={loading || selectedChannels.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating ideas..." : ideas.length > 0 ? "Regenerate All" : "Generate Content Ideas"}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Ideas */}
      {ideas.length > 0 ? (
        <div className="space-y-6 pt-2">
          <div className="h-px bg-black/5" />
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.channelName}
              idea={idea}
              onRegenerate={handleRegenerate}
              regenerating={regeneratingChannel === idea.channelName}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : readOnly ? (
        <div className="text-center py-12 text-sm text-gray-400">
          No ideas were generated for this date.
        </div>
      ) : null}
    </div>
  );
}
