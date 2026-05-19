"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Copy, Check, RefreshCw, Loader2, MessageSquare,
  BookOpen, TrendingUp, ChevronLeft, ChevronRight, ArrowLeft, Lock,
  Calendar as CalendarIcon, X,
} from "lucide-react";
import type { Playbook } from "@/lib/types";

interface Post {
  type: "gyaan" | "story" | "trending" | "reddit_subreddit";
  title?: string;
  content: string;
  // Reddit subreddit-specific fields
  subreddit?: string;
  flair?: string;
  instructions?: string;
  strategy?: "pure_value" | "seeded";
}

interface ChannelContent {
  channelName: string;
  posts: Post[];
}

interface Props {
  playbook: Playbook;
}

const TIER_1_CHANNELS = ["Reddit", "LinkedIn", "X (Twitter)"];

function buildIcpSummary(playbook: Playbook) {
  const icp = playbook.icp;
  if (!icp?.title) return `Product: ${playbook.productName}. ${(playbook as any).productDescription ?? playbook.summary ?? ""}`;
  const painPoints = (icp.painPoints ?? []).slice(0, 3).join(", ");
  return `${icp.title}. ${icp.summary ?? ""} Pain points: ${painPoints}.`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function storageKey(playbookId: string, date: string) {
  return `tier1_content_${playbookId}_${date}`;
}

function channelToQueuePlatform(channelName: string): "twitter" | "linkedin" | null {
  if (channelName === "LinkedIn") return "linkedin";
  if (channelName === "X (Twitter)") return "twitter";
  return null; // Reddit — not queueable
}

function ScheduleButton({ content, platform, playbookId }: {
  content: string;
  platform: "twitter" | "linkedin";
  playbookId: string;
}) {
  const [open, setOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  const handleAdd = async () => {
    if (!scheduledFor) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/agent/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform,
          scheduledFor: new Date(scheduledFor).toISOString(),
          playbookId,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setTimeout(() => { setOpen(false); setStatus("idle"); setScheduledFor(""); }, 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff6b4e] transition-colors px-2 py-1 rounded-lg hover:bg-white"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        Schedule
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="datetime-local"
        value={scheduledFor}
        onChange={(e) => setScheduledFor(e.target.value)}
        min={minDatetime}
        className="px-2 py-1 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#ff6b4e] transition"
      />
      <button
        onClick={handleAdd}
        disabled={!scheduledFor || status === "loading"}
        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
          status === "done"
            ? "bg-emerald-500 text-white"
            : status === "error"
            ? "bg-red-500 text-white"
            : "bg-[#ff6b4e] text-white hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {status === "loading" ? "Adding…" : status === "done" ? "✓ Added!" : status === "error" ? "Failed" : "Add"}
      </button>
      <button onClick={() => { setOpen(false); setStatus("idle"); }} className="p-1 text-gray-400 hover:text-gray-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Post type config ────────────────────────────────────────────────────────

const POST_TYPE_META = {
  gyaan: { label: "Insight / Quote", icon: BookOpen, border: "border-blue-100", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" },
  story: { label: "Founder Story", icon: MessageSquare, border: "border-emerald-100", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700" },
  trending: { label: "Trending Hook", icon: TrendingUp, border: "border-amber-100", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700" },
};

function PostCard({ post, playbookId, channelName }: {
  post: Post;
  playbookId?: string;
  channelName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const meta = POST_TYPE_META[post.type as keyof typeof POST_TYPE_META] ?? POST_TYPE_META.gyaan;
  const Icon = meta.icon;

  const copyPayload = post.title ? `${post.title}\n\n${post.content}` : post.content;
  const queuePlatform = channelName ? channelToQueuePlatform(channelName) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 space-y-3`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {queuePlatform && playbookId && (
            <ScheduleButton content={copyPayload} platform={queuePlatform} playbookId={playbookId} />
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {post.title && (
        <p className="text-sm font-bold text-[#1a1a2e] leading-snug">{post.title}</p>
      )}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
    </div>
  );
}

function RedditPostCard({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false);
  const copyPayload = `${post.title ?? ""}\n\n${post.content}`.trim();
  const isSeeded = post.strategy === "seeded";

  const handleCopy = () => {
    navigator.clipboard.writeText(copyPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${isSeeded ? "border-amber-100 bg-amber-50" : "border-emerald-100 bg-emerald-50"}`}>
      {/* Strategy + subreddit row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {isSeeded ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-800">
              Value + Seeded (1/week)
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800">
              Pure Value (Karma Builder)
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
            r/{post.subreddit}
          </span>
          {post.flair && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-orange-200 text-orange-600">
              [{post.flair}]
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-white"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {post.title && (
        <p className="text-sm font-bold text-[#1a1a2e] leading-snug">{post.title}</p>
      )}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      <div className={`pt-2 border-t space-y-1 ${isSeeded ? "border-amber-100" : "border-emerald-100"}`}>
        {post.instructions && (
          <p className={`text-xs font-medium ${isSeeded ? "text-amber-700" : "text-emerald-700"}`}>
            Action Item: {post.instructions}
          </p>
        )}
        {isSeeded && (
          <p className="text-xs text-gray-400 font-medium">Never include your URL in the post body — comments only.</p>
        )}
      </div>
    </div>
  );
}

function ChannelSection({
  content, onRegenerate, regenerating, readOnly, playbookId,
}: {
  content: ChannelContent;
  onRegenerate: (channelName: string) => void;
  regenerating: boolean;
  readOnly: boolean;
  playbookId?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1a1a2e]">{content.channelName}</h3>
        {!readOnly && (
          <button
            onClick={() => onRegenerate(content.channelName)}
            disabled={regenerating}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff6b4e] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
        )}
      </div>
      <div className="space-y-3">
        {content.posts.map((post, idx) =>
          post.type === "reddit_subreddit"
            ? <RedditPostCard key={idx} post={post} />
            : <PostCard key={post.type} post={post} playbookId={playbookId} channelName={content.channelName} />
        )}
      </div>
    </div>
  );
}

// ── Calendar ────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function Calendar({
  playbookId,
  datesWithContent,
  trialDays,
  onSelectDate,
}: {
  playbookId: string;
  datesWithContent: Set<string>;
  trialDays: number;
  onSelectDate: (date: string) => void;
}) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const today = todayStr();

  // Trial window: earliest accessible date
  const trialStart = new Date();
  trialStart.setDate(trialStart.getDate() - (trialDays - 1));
  const trialStartStr = `${trialStart.getFullYear()}-${String(trialStart.getMonth() + 1).padStart(2, "0")}-${String(trialStart.getDate()).padStart(2, "0")}`;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  // Don't navigate before the month that contains today (no point — all future is locked, all past before trial is locked)
  const canGoPrev = !(calYear === now.getFullYear() && calMonth === now.getMonth());

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-bold text-[#1a1a2e]">{MONTHS[calMonth]} {calYear}</span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
        ))}

        {/* Empty cells */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const isPast = dateStr < today;
          const hasContent = datesWithContent.has(dateStr);
          const isOutsideTrial = trialDays < 365 && dateStr < trialStartStr;
          const isClickable = isToday || (isPast && hasContent && !isOutsideTrial);

          return (
            <button
              key={dateStr}
              disabled={!isClickable && !isFuture ? false : isFuture || (!isClickable)}
              onClick={() => isClickable && onSelectDate(dateStr)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                ${isToday && hasContent ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600" : ""}
                ${isToday && !hasContent ? "bg-[#ff6b4e] text-white shadow-md hover:bg-[#e85c3f]" : ""}
                ${isPast && hasContent && isClickable ? "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer" : ""}
                ${isPast && !hasContent && isClickable ? "bg-white border border-gray-200 text-gray-700 hover:border-[#ff6b4e]/50 hover:bg-[#ff6b4e]/5 cursor-pointer" : ""}
                ${isPast && !isClickable && !isOutsideTrial ? "text-gray-300 cursor-default" : ""}
                ${isFuture ? "text-gray-300 cursor-default" : ""}
                ${isOutsideTrial && isPast ? "text-gray-200 cursor-default" : ""}
              `}
            >
              <span>{day}</span>
              {isOutsideTrial && isPast && (
                <Lock className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-gray-300" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff6b4e]" />
          <span className="text-xs text-gray-400">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xl bg-emerald-100 border border-emerald-200" />
          <span className="text-xs text-gray-400">Content generated</span>
        </div>
        {trialDays < 365 && (
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-gray-300" />
            <span className="text-xs text-gray-400">Outside trial</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function WeeklyContentEngine({ playbook }: Props) {
  const tier1Channels = TIER_1_CHANNELS;

  const [view, setView] = useState<"calendar" | "content">("calendar");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [datesWithContent, setDatesWithContent] = useState<Set<string>>(new Set());
  const [trialDays, setTrialDays] = useState(365);

  const [selectedChannels, setSelectedChannels] = useState<string[]>([...tier1Channels]);
  const [generatedContent, setGeneratedContent] = useState<ChannelContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [regeneratingChannel, setRegeneratingChannel] = useState<string | null>(null);
  const [error, setError] = useState("");
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load dates that have content
  useEffect(() => {
    const dates = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`tier1_content_${playbook.id}_`)) {
        dates.add(key.replace(`tier1_content_${playbook.id}_`, ""));
      }
    }
    setDatesWithContent(dates);
  }, [playbook.id]);

  // Check trial status
  useEffect(() => {
    async function checkTrial() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.app_metadata?.subscription_status === "on_trial") {
          setTrialDays(7);
        }
      } catch {}
    }
    checkTrial();
  }, []);

  // Progress bar effect
  useEffect(() => {
    if (loading) {
      setProgress(0);
      progressInterval.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 85) { clearInterval(progressInterval.current!); return 85; }
          return p + Math.random() * 6 + 2;
        });
      }, 400);
    } else {
      clearInterval(progressInterval.current!);
      if (progress > 0) {
        setProgress(100);
        setTimeout(() => setProgress(0), 600);
      }
    }
    return () => clearInterval(progressInterval.current!);
  }, [loading]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setError("");
    const saved = localStorage.getItem(storageKey(playbook.id, date));
    setGeneratedContent(saved ? JSON.parse(saved) : []);
    setView("content");
  };

  const toggleChannel = (name: string) => {
    setSelectedChannels((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const callAPI = async (channels: string[]): Promise<ChannelContent[]> => {
    const res = await fetch("/api/generate-tier1-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedChannels: channels,
        productName: playbook.productName || (playbook as any).name || "My Product",
        productDescription: (playbook as any).productDescription || playbook.summary || "",
        icpSummary: buildIcpSummary(playbook),
        playbookId: playbook.id,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Generation failed");
    }
    return (await res.json()).channels as ChannelContent[];
  };

  const saveContent = (date: string, content: ChannelContent[]) => {
    localStorage.setItem(storageKey(playbook.id, date), JSON.stringify(content));
    setDatesWithContent((prev) => new Set([...prev, date]));
  };

  const handleGenerate = async () => {
    if (!selectedChannels.length) return;
    setLoading(true);
    setError("");
    try {
      const newContent = await callAPI(selectedChannels);
      setGeneratedContent(newContent);
      saveContent(selectedDate, newContent);
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
      const updated = generatedContent.map((c) => c.channelName === channelName ? fresh[0] : c);
      if (!updated.find((c) => c.channelName === channelName)) updated.push(fresh[0]);
      setGeneratedContent(updated);
      saveContent(selectedDate, updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegeneratingChannel(null);
    }
  };

  const today = todayStr();
  const isToday = selectedDate === today;
  const readOnly = !isToday;

  // ── Calendar view ──────────────────────────────────────────────────────────
  if (view === "calendar") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Weekly Content Engine</h2>
          <p className="text-sm text-gray-500">
            Pick a day to generate or review content. You can only generate on today's date.
          </p>
        </div>

        {trialDays < 365 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-sm text-orange-700 font-medium">
            <Lock className="w-4 h-4 shrink-0" />
            Free trial — content generation available for {trialDays} days.
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <Calendar
            playbookId={playbook.id}
            datesWithContent={datesWithContent}
            trialDays={trialDays}
            onSelectDate={handleSelectDate}
          />
        </div>

        <button
          onClick={() => handleSelectDate(today)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold shadow-md hover:bg-black transition-colors"
        >
          <Sparkles className="w-4 h-4 text-[#ff6b4e]" />
          Generate Today's Content
        </button>
      </div>
    );
  }

  // ── Content view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => setView("calendar")}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1a1a2e] transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to calendar
          </button>
          <h2 className="text-xl font-bold text-[#1a1a2e]">{formatDisplay(selectedDate)}</h2>
          {readOnly && (
            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Past date — view only
            </p>
          )}
        </div>
      </div>

      {/* Channel selection — only shown for today */}
      {!readOnly && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Channels</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tier1Channels.map((name) => {
              const isSelected = selectedChannels.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => toggleChannel(name)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected ? "border-[#ff6b4e] bg-[#ff6b4e]/5" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? "text-[#ce4a2f]" : "text-gray-800"}`}>{name}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-[#ff6b4e] bg-[#ff6b4e]" : "border-gray-300"}`}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate button + progress — only for today */}
      {!readOnly && (
        <div className="space-y-3">
          <button
            onClick={handleGenerate}
            disabled={loading || selectedChannels.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold shadow-md hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#ff6b4e]" />}
            {loading ? "Generating posts…" : generatedContent.length > 0 ? "Regenerate All" : "Generate Today's Posts"}
          </button>

          {progress > 0 && (
            <div className="w-full max-w-xs space-y-1.5">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {progress < 100 ? `Writing posts for ${selectedChannels.length} channel${selectedChannels.length !== 1 ? "s" : ""}…` : "Done!"}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Generated content */}
      {generatedContent.length > 0 ? (
        <div className="space-y-8 pt-2">
          <div className="h-px bg-black/5" />
          {generatedContent.map((content) => (
            <ChannelSection
              key={content.channelName}
              content={content}
              onRegenerate={handleRegenerate}
              regenerating={regeneratingChannel === content.channelName}
              readOnly={readOnly}
              playbookId={playbook.id}
            />
          ))}
        </div>
      ) : readOnly ? (
        <div className="text-center py-16 text-sm text-gray-400">No content was generated on this day.</div>
      ) : null}
    </div>
  );
}
