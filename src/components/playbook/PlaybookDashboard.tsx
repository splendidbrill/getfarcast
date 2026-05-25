"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Share2, Download, BookOpen, Zap, Sparkles,
  ChevronRight, TrendingUp, ArrowLeft, Check, Eye,
  Clock, Network, Flame, BarChart2, CalendarDays, Lightbulb,
  X as XIcon, AtSign, MessageCircle, RotateCw, MoreHorizontal,
  ArrowRight, ChevronDown, Copy, Pencil, Quote, ArrowUpRight,
  Send, Filter, Loader2,
} from "lucide-react";
import type { Playbook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";
import { PlaybookChannels } from "./PlaybookChannels";
import { WeeklyContentEngine } from "./WeeklyContentEngine";
import { WeeklyContentIdeas } from "./WeeklyContentIdeas";
import { RivalSpying } from "./RivalSpying";
import { PlaybookPrintView } from "./PlaybookPrintView";
import { WarmLeads } from "./WarmLeads";
import { GrowthHacks } from "./GrowthHacks";
import { QueueManager } from "./QueueManager";
import { HermesDailyQueueCard } from "./HermesDailyQueueCard";
import Link from "next/link";

type MainTab = "dashboard" | "overview" | "icp" | "channels" | "rivals" | "posts" | "leads" | "growth-hacks" | "queue";
type ContentSubTab = "weekly-engine" | "weekly-ideas";
type Platform = "x" | "linkedin" | "reddit";

// ── Real data types ────────────────────────────────────────────────────────────

interface DashPost {
  type: "gyaan" | "story" | "trending" | "reddit_subreddit";
  title?: string;
  content: string;
  subreddit?: string;
  flair?: string;
  instructions?: string;
  strategy?: "pure_value" | "seeded";
}

interface DashChannelContent {
  channelName: string;
  posts: DashPost[];
}

interface RealLead {
  id: string;
  platform: string;
  username_or_name: string;
  bio_or_headline: string | null;
  profile_url: string;
  matched_text_preview: string | null;
  matched_keyword: string | null;
  source_url: string | null;
  created_at: string;
  intent_level: "high" | "medium" | "low" | null;
  lead_score: number | null;
  seen_count: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TAB_TO_CHANNEL: Record<Platform, string> = {
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

const CHAR_LIMIT: Record<string, number> = {
  "X (Twitter)": 280,
  LinkedIn: 3000,
  Reddit: 40000,
};

const POST_ANGLE: Record<string, string> = {
  gyaan: "Insight / Quote",
  story: "Founder Story",
  trending: "Trending Hook",
  reddit_subreddit: "Reddit Value Post",
};

const POST_VOICE: Record<string, number> = {
  gyaan: 92,
  story: 88,
  trending: 84,
  reddit_subreddit: 90,
};

const SECTION_LABEL: Record<MainTab, string> = {
  dashboard:      "dashboard",
  overview:       "executive summary",
  icp:            "audience profiling",
  channels:       "distribution channels",
  leads:          "warm leads",
  "growth-hacks": "growth hacks",
  rivals:         "rival spying",
  queue:          "post queue",
  posts:          "content engine",
};

const NAV_ITEMS: { id: MainTab; icon: React.ElementType; label: string }[] = [
  { id: "dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { id: "overview",     icon: BookOpen,        label: "Executive Summary" },
  { id: "icp",          icon: Users,           label: "Audience Profiling" },
  { id: "channels",     icon: Network,         label: "Distribution Channels" },
  { id: "leads",        icon: Flame,           label: "Warm Leads" },
  { id: "growth-hacks", icon: TrendingUp,      label: "Growth Hacks" },
  { id: "rivals",       icon: Eye,             label: "Rival Spying" },
  { id: "queue",        icon: Clock,           label: "Post Queue" },
  { id: "posts",        icon: Sparkles,        label: "Content Engine" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storageKey(id: string) {
  return `tier1_content_${id}_${todayStr()}`;
}

function buildIcpSummary(p: Playbook): string {
  const icp = p.icp;
  if (!icp?.title) return `Product: ${p.productName}. ${p.summary ?? ""}`;
  return `${icp.title}. ${icp.summary ?? ""} Pain points: ${(icp.painPoints ?? []).slice(0, 3).join(", ")}.`;
}

function buildRationale(post: DashPost, channelName: string, productName: string): string {
  const platform = channelName.includes("Twitter") ? "X" : channelName.includes("LinkedIn") ? "LinkedIn" : "Reddit";
  if (post.type === "gyaan")
    return `Insight post targeting your ICP. Sharp, deadpan observation about the distribution problem your ICP faces — the thing every founder thinks but nobody types. Adapted to ${platform}'s format for maximum resonance.`;
  if (post.type === "story")
    return `Founder moment post. 1 sentence, lowercase, capturing the absurd reality of building ${productName}. Designed to feel authentic and relatable. No product mention needed — the pain is universal.`;
  if (post.type === "trending")
    return `Trending reaction post. Pulled from current search signals in your ICP space this week. Takes a contrarian or dry angle on what's happening — positions you as someone with a clear point of view.`;
  if (post.type === "reddit_subreddit") {
    if (post.strategy === "seeded")
      return `Seeded value post for r/${post.subreddit}. 90% raw insight, 10% product context. Mentions ${productName} as a detail in the story — never a pitch. Drop link in comments only after someone replies.`;
    return `Pure value post for r/${post.subreddit}. Zero product mentions. Builds karma by delivering genuine insight the community will upvote. Mirror the format of top posts in this sub.`;
  }
  return "Generated by Hermes based on your ICP profile, channel strategy, and current market signals.";
}

function voiceScore(post: DashPost): number {
  let base = POST_VOICE[post.type] ?? 86;
  if (post.type === "reddit_subreddit" && post.strategy === "pure_value") base = 87;
  return base;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function HeatPill({ level }: { level: "high" | "medium" | "low" | null }) {
  if (level === "high")
    return (
      <span className="inline-flex items-center gap-1 rounded-[5px] border border-[#FBD6C7] bg-[#FFF1EC] px-1.5 py-[2px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#D84111]">
        <Flame className="h-2.5 w-2.5" strokeWidth={2} /> hot
      </span>
    );
  if (level === "medium")
    return (
      <span className="inline-flex items-center gap-1 rounded-[5px] border border-[#FDE68A] bg-[#FEF7E6] px-1.5 py-[2px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#B45309]">
        ↳ warm
      </span>
    );
  return null;
}

function VoiceGauge({ value }: { value: number }) {
  const color = value >= 90 ? "#15803D" : value >= 80 ? "#F04E23" : "#B45309";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-[120px] overflow-hidden rounded-full bg-[#E7E5E0]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function PlatformTabs({ value, onChange, items }: {
  value: Platform;
  onChange: (v: Platform) => void;
  items: { id: Platform; icon: React.ElementType; label: string; count: string; badge?: { label: string; tone: "ok" } }[];
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-[#F6F4EF] p-1 ring-1 ring-inset ring-[#E7E5E0]">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            className={`flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 font-mono text-[11.5px] transition
              ${active ? "bg-white text-[#171717] ring-1 ring-inset ring-[#E7E5E0]" : "text-[#737373] hover:text-[#171717]"}`}>
            <it.icon className="h-3 w-3" strokeWidth={1.75} />
            <span className="lowercase">{it.label}</span>
            <span className={`font-mono text-[10px] ${active ? "text-[#737373]" : "text-[#A3A3A3]"}`}>{it.count}</span>
            {it.badge && (
              <span className="ml-1 rounded-[4px] bg-[#ECFDF3] px-1 py-[1px] font-mono text-[9px] uppercase tracking-wider text-[#15803D]">
                {it.badge.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Dashboard Card 01: Content Engine (real) ──────────────────────────────────

function DashboardContentEngineCard({
  playbook,
  playbookId,
}: {
  playbook: Playbook;
  playbookId: string;
}) {
  const [platform, setPlatform] = useState<Platform>("x");
  const [idx, setIdx] = useState(0);
  const [content, setContent] = useState<DashChannelContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenPlatform, setRegenPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [rationaleOpen, setRationaleOpen] = useState(true);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const s = localStorage.getItem(storageKey(playbookId));
    if (s) try { setContent(JSON.parse(s)); } catch {}
  }, [playbookId]);

  useEffect(() => { setIdx(0); }, [platform]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      iv.current = setInterval(() => setProgress(p => {
        if (p >= 85) { clearInterval(iv.current!); return 85; }
        return p + Math.random() * 6 + 2;
      }), 400);
    } else {
      clearInterval(iv.current!);
      if (progress > 0) { setProgress(100); setTimeout(() => setProgress(0), 600); }
    }
    return () => clearInterval(iv.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const callAPI = useCallback(async (channels: string[]): Promise<DashChannelContent[]> => {
    const r = await fetch("/api/generate-tier1-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedChannels: channels,
        productName: playbook.productName,
        productDescription: (playbook as any).productDescription || playbook.summary || "",
        icpSummary: buildIcpSummary(playbook),
        playbookId: playbook.id,
      }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Generation failed"); }
    return (await r.json()).channels as DashChannelContent[];
  }, [playbook]);

  const save = (c: DashChannelContent[]) =>
    localStorage.setItem(storageKey(playbookId), JSON.stringify(c));

  const handleGenerate = async () => {
    setLoading(true); setError("");
    try {
      const c = await callAPI(["X (Twitter)", "LinkedIn", "Reddit"]);
      setContent(c); save(c);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleRegen = async () => {
    setRegenPlatform(platform); setError("");
    try {
      const fresh = await callAPI([TAB_TO_CHANNEL[platform]]);
      const updated = content.map(c => c.channelName === TAB_TO_CHANNEL[platform] ? fresh[0] : c);
      if (!updated.find(c => c.channelName === TAB_TO_CHANNEL[platform])) updated.push(fresh[0]);
      setContent(updated); save(updated);
    } catch (e) { setError(e instanceof Error ? e.message : "Regeneration failed."); }
    finally { setRegenPlatform(null); }
  };

  const currentChannel = TAB_TO_CHANNEL[platform];
  const drafts = content.find(c => c.channelName === currentChannel)?.posts ?? [];
  const cur = drafts[idx] ?? null;

  const counts = (p: Platform) =>
    content.find(c => c.channelName === TAB_TO_CHANNEL[p])?.posts.length ?? 0;
  const totalDrafts = Object.values(TAB_TO_CHANNEL).reduce(
    (sum, ch) => sum + (content.find(c => c.channelName === ch)?.posts.length ?? 0), 0
  );

  const tabs: { id: Platform; icon: React.ElementType; label: string; count: string; badge?: { label: string; tone: "ok" } }[] = [
    { id: "x",        icon: XIcon,          label: "x",        count: `(${counts("x")})` },
    { id: "linkedin", icon: AtSign,         label: "linkedin", count: `(${counts("linkedin")})` },
    { id: "reddit",   icon: MessageCircle,  label: "reddit",   count: `(${counts("reddit")})`, badge: counts("reddit") > 0 ? { label: "rate-safe", tone: "ok" } : undefined },
  ];

  const charLimit = CHAR_LIMIT[currentChannel] ?? 3000;
  const isRegen = regenPlatform === platform;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-[#E7E5E0] bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#E7E5E0] bg-[#FAFAF7]/60 px-5 py-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
            <span>card 01</span>
            <span className="text-[#A3A3A3]">·</span>
            <span className="text-[#D84111]">CONTENT ENGINE</span>
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[#171717]">today&apos;s content engine</h2>
          <p className="mt-1 font-mono text-[11px] text-[#737373]">
            {content.length > 0 ? `${totalDrafts} drafts across 3 channels` : "no posts yet today"}
          </p>
        </div>
        {content.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handleRegen} disabled={!!regenPlatform}
              className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11.5px] text-[#3F3F3F] hover:bg-[#F6F4EF] disabled:opacity-50">
              <RotateCw className={`h-3 w-3 ${isRegen ? "animate-spin" : ""}`} />
              {isRegen ? "regenerating…" : "regenerate"}
            </button>
          </div>
        )}
      </div>

      {content.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-5 py-14 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1EC]">
            <Sparkles className="h-5 w-5 text-[#F04E23]" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#171717]">no posts yet today</p>
            <p className="mt-1 text-[13px] text-[#737373]">generate posts for X, LinkedIn, and Reddit in one shot.</p>
          </div>
          <button onClick={handleGenerate} disabled={loading}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#171717] px-6 text-[13px] font-medium text-white hover:bg-[#3F3F3F] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "generating posts…" : "generate today's posts"}
          </button>
          {progress > 0 && (
            <div className="w-full max-w-xs space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7E5E0]">
                <div className="h-full rounded-full bg-[#F04E23] transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <p className="font-mono text-[11px] text-[#737373]">writing posts for 3 channels…</p>
            </div>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3 w-full">{error}</p>}
        </div>
      ) : (
        <>
          {/* Platform tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-[#E7E5E0] px-5 py-3">
            <PlatformTabs value={platform} onChange={setPlatform} items={tabs} />
            <div className="hidden items-center gap-3 font-mono text-[10.5px] text-[#737373] md:flex">
              <span className="flex items-center gap-1 text-[#15803D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" /> within limits
              </span>
              <span className="text-[#A3A3A3]">·</span>
              <span>posts/day · {totalDrafts} of 8</span>
            </div>
          </div>

          {/* Draft cycler */}
          {drafts.length > 1 && (
            <div className="flex items-center gap-2 border-b border-[#E7E5E0] bg-[#F6F4EF]/40 px-5 py-2.5">
              {drafts.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`flex h-7 items-center gap-1.5 rounded-[5px] px-2 font-mono text-[11px] transition
                    ${i === idx ? "bg-[#171717] text-white" : "border border-[#E7E5E0] bg-white text-[#737373] hover:text-[#171717]"}`}>
                  draft {String(i + 1).padStart(2, "0")}
                </button>
              ))}
              <button onClick={() => setIdx((idx - 1 + drafts.length) % drafts.length)}
                className="flex h-7 items-center gap-1 rounded-[5px] px-2 font-mono text-[11px] text-[#737373] hover:text-[#171717]">
                ← prev
              </button>
              <button onClick={() => setIdx((idx + 1) % drafts.length)}
                className="flex h-7 items-center gap-1 rounded-[5px] px-2 font-mono text-[11px] text-[#737373] hover:text-[#171717]">
                next →
              </button>
            </div>
          )}

          {/* Draft body */}
          {cur ? (
            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#171717] px-1.5 py-[2px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-white">
                    {String(idx + 1).padStart(2, "0")} / {String(drafts.length).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] text-[#737373]">{POST_ANGLE[cur.type] ?? cur.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">voice-fit</span>
                  <VoiceGauge value={voiceScore(cur)} />
                </div>
              </div>

              {/* Hermes rationale */}
              <div className="rounded-md border border-[#E7E5E0] bg-[#F6F4EF]/60">
                <button onClick={() => setRationaleOpen(!rationaleOpen)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#D84111]">↳ hermes rationale</span>
                    <span className="font-mono text-[10.5px] text-[#737373]">why this draft</span>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-[#737373] transition-transform ${rationaleOpen ? "" : "-rotate-90"}`} />
                </button>
                {rationaleOpen && (
                  <div className="border-t border-[#E7E5E0] px-3 py-2.5">
                    <p className="font-mono text-[11.5px] leading-[1.65] text-[#3F3F3F]">
                      {buildRationale(cur, currentChannel, playbook.productName)}
                    </p>
                    {cur.type === "reddit_subreddit" && cur.instructions && (
                      <div className="mt-2.5 rounded-md border border-[#E7E5E0] bg-[#FEF7E6] px-3 py-2">
                        <p className="font-mono text-[10.5px] text-[#B45309]">
                          <span className="uppercase tracking-[0.1em]">tip · </span>{cur.instructions}
                        </p>
                      </div>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[
                        `type: ${cur.type.replace("_", " ")}`,
                        `platform: ${platform === "x" ? "x (twitter)" : platform}`,
                        ...(cur.strategy ? [`strategy: ${cur.strategy.replace("_", " ")}`] : []),
                        ...(cur.subreddit ? [`r/${cur.subreddit}`] : []),
                      ].map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-[5px] border border-[#E7E5E0] bg-[#F6F4EF] px-1.5 py-[2px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#3F3F3F]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Draft text */}
              <DraftTextBlock cur={cur} idx={idx} total={drafts.length} charLimit={charLimit} onCopyToast={setToast} />

              {/* Footer log */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-[#737373]">
                <span>hermes · {todayStr()} · model: claude</span>
                <span className="text-[#A3A3A3]">·</span>
                <span>{platform === "reddit" ? "rate-limited mode · 3–4 posts / week max" : "within posting window"}</span>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center font-mono text-[12px] text-[#737373]">
              no drafts for this channel yet — <button onClick={handleRegen} className="text-[#F04E23] hover:underline">regenerate</button>
            </div>
          )}

          {error && <p className="mx-5 mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-[#171717] px-3 py-1.5 font-mono text-[11px] text-white">
          {toast}
        </div>
      )}
    </article>
  );
}

function DraftTextBlock({ cur, idx, total, charLimit, onCopyToast }: {
  cur: DashPost;
  idx: number;
  total: number;
  charLimit: number;
  onCopyToast: (msg: string) => void;
}) {
  const raw = cur.title ? `${cur.title}\n\n${cur.content}` : cur.content;
  const [text, setText] = useState(raw);
  useEffect(() => { setText(cur.title ? `${cur.title}\n\n${cur.content}` : cur.content); }, [cur]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    onCopyToast(`copied draft ${String(idx + 1).padStart(2, "0")} to clipboard`);
  };

  return (
    <div className="relative rounded-md border border-[#E7E5E0] bg-white">
      <div className="flex items-center justify-between border-b border-[#E7E5E0] px-3 py-1.5">
        <span className="font-mono text-[10.5px] text-[#737373]">{String(idx + 1).padStart(2, "0")} of {String(total).padStart(2, "0")}</span>
        <span className="font-mono text-[10.5px] tabular-nums">
          <span className={text.length > charLimit * 0.9 ? "text-[#B45309]" : "text-[#737373]"}>{text.length}</span>
          <span className="text-[#A3A3A3]"> / {charLimit}</span>
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none bg-transparent px-4 py-4 font-sans text-[14px] leading-[1.6] text-[#171717] focus:outline-none"
        rows={Math.max(4, Math.min(14, text.split("\n").length + 1))}
      />
      <div className="flex items-center justify-between gap-2 border-t border-[#E7E5E0] bg-[#FAFAF7]/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <button className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11.5px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
            <Pencil className="h-3 w-3" /> edit
          </button>
        </div>
        <button onClick={handleCopy}
          className="flex h-8 items-center gap-1.5 rounded-md bg-[#F04E23] px-3 font-mono text-[12px] font-medium text-white ring-1 ring-inset ring-[#D84111] hover:bg-[#D84111]">
          <Copy className="h-3.5 w-3.5" /> copy
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Card 02: Warm-Lead Inbox (real) ─────────────────────────────────

function DashboardLeadCard({ lead, playbook, onNavigate }: {
  lead: RealLead;
  playbook: Playbook;
  onNavigate: (tab: MainTab) => void;
}) {
  const [dm, setDm] = useState<string | null>(null);
  const [loadingDm, setLoadingDm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);

  const platformLabel: Record<string, string> = {
    twitter_x: "X",
    linkedin: "LinkedIn",
    reddit: "Reddit",
  };
  const avatarLetters = lead.username_or_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleGenerateDm = async () => {
    setLoadingDm(true); setReplyOpen(true);
    try {
      const res = await fetch("/api/generate-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: playbook.productName,
          productDescription: (playbook as any).productDescription || playbook.summary || "",
          platform: lead.platform,
          username_or_name: lead.username_or_name,
          bio_or_headline: lead.bio_or_headline,
          matched_text_preview: lead.matched_text_preview,
          matched_keyword: lead.matched_keyword,
          page_context: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate reply");
      setDm(json.dm ?? json.message ?? "");
    } catch {
      setDm("Failed to generate reply. Please try again.");
    } finally {
      setLoadingDm(false);
    }
  };

  const handleCopy = () => {
    if (dm) { navigator.clipboard?.writeText(dm); setCopied(true); setTimeout(() => setCopied(false), 1400); }
  };

  return (
    <div className="border-b border-[#E7E5E0] px-5 py-4 last:border-0">
      {/* Lead head */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] font-mono text-[11px] font-medium text-white">
          {avatarLetters}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-medium tracking-tight text-[#171717]">{lead.username_or_name}</span>
            <span className="rounded-md border border-[#E7E5E0] px-1.5 py-[2px] font-mono text-[10.5px] text-[#737373]">
              {platformLabel[lead.platform] ?? lead.platform}
            </span>
            <HeatPill level={lead.intent_level} />
            <span className="font-mono text-[10.5px] text-[#A3A3A3]">· {timeAgo(lead.created_at)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-[#737373]">
            {lead.matched_keyword && <span>matched: <span className="text-[#3F3F3F]">{lead.matched_keyword}</span></span>}
            {lead.lead_score != null && <><span className="text-[#A3A3A3]">·</span><span>score <span className="tabular-nums text-[#3F3F3F]">{lead.lead_score}</span></span></>}
          </div>
        </div>
      </div>

      {/* Matched text (their post) */}
      {lead.matched_text_preview && (
        <div className="mt-3 rounded-md border border-[#E7E5E0] bg-white px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#737373]">
            <Quote className="h-2.5 w-2.5" /> matched post
          </div>
          <p className="text-[13px] leading-[1.55] text-[#3F3F3F] line-clamp-4">{lead.matched_text_preview}</p>
        </div>
      )}

      {/* Reply section */}
      {!replyOpen ? (
        <div className="mt-3 flex items-center gap-2">
          <a href={lead.profile_url} target="_blank" rel="noopener noreferrer"
            className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
            <ArrowUpRight className="h-2.5 w-2.5" /> profile
          </a>
          {lead.source_url && (
            <a href={lead.source_url} target="_blank" rel="noopener noreferrer"
              className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
              <ArrowUpRight className="h-2.5 w-2.5" /> post
            </a>
          )}
          <button onClick={handleGenerateDm}
            className="flex h-7 items-center gap-1.5 rounded-md bg-[#F04E23] px-2.5 font-mono text-[11px] font-medium text-white ring-1 ring-inset ring-[#D84111] hover:bg-[#D84111]">
            <Sparkles className="h-2.5 w-2.5" /> generate reply
          </button>
        </div>
      ) : (
        /* Suggested reply inset card */
        <div className="relative ml-6 mt-2 rounded-md border border-[#E7E5E0] bg-[#F6F4EF]/70">
          <span className="absolute -left-3 top-4 h-px w-3 bg-[#E7E5E0]" />
          <span className="absolute -left-3 -top-1 h-5 w-3 rounded-bl border-b border-l border-[#E7E5E0]" />

          <div className="flex items-center justify-between gap-2 border-b border-[#E7E5E0] px-3 py-2">
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#D84111]">
              <Sparkles className="h-2.5 w-2.5" /> hermes suggested reply
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#737373]">
              <span>tone · founder-honest</span>
              <button onClick={() => { setDm(null); setReplyOpen(false); }} className="text-[#A3A3A3] hover:text-[#737373]">✕</button>
            </div>
          </div>

          {loadingDm ? (
            <div className="flex items-center justify-center gap-2 px-3.5 py-6 font-mono text-[11px] text-[#737373]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> generating reply…
            </div>
          ) : (
            <>
              <div className="px-3.5 py-3">
                <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-[1.55] text-[#171717]">{dm}</pre>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#E7E5E0] bg-[#FAFAF7]/40 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <a href={lead.profile_url} target="_blank" rel="noopener noreferrer"
                    className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
                    <ArrowUpRight className="h-2.5 w-2.5" /> profile
                  </a>
                  <button onClick={handleGenerateDm} disabled={loadingDm}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11px] text-[#3F3F3F] hover:bg-[#F6F4EF] disabled:opacity-50">
                    <RotateCw className={`h-2.5 w-2.5 ${loadingDm ? "animate-spin" : ""}`} /> retry
                  </button>
                </div>
                <button onClick={handleCopy}
                  className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 font-mono text-[11px] ring-1 ring-inset transition
                    ${copied ? "bg-[#ECFDF3] text-[#15803D] ring-[#BBF7D0]" : "bg-[#171717] text-white ring-[#171717] hover:bg-[#3F3F3F]"}`}>
                  {copied ? <><Check className="h-2.5 w-2.5" /> copied!</> : <><Send className="h-2.5 w-2.5" /> copy dm</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardWarmLeadsCard({
  playbookId,
  playbook,
  onNavigate,
}: {
  playbookId: string;
  playbook: Playbook;
  onNavigate: (tab: MainTab) => void;
}) {
  const [leads, setLeads] = useState<RealLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<Platform>("x");

  useEffect(() => {
    fetch(`/api/extension/intent-leads?playbookId=${playbookId}`)
      .then(r => r.json())
      .then(j => setLeads(j.leads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playbookId]);

  const platformLeads: Record<Platform, RealLead[]> = {
    x:        leads.filter(l => l.platform === "twitter_x").slice(0, 3),
    linkedin: leads.filter(l => l.platform === "linkedin").slice(0, 3),
    reddit:   leads.filter(l => l.platform === "reddit").slice(0, 3),
  };

  const counts = (p: Platform) => leads.filter(l =>
    l.platform === (p === "x" ? "twitter_x" : p)
  ).length;

  const tabs: { id: Platform; icon: React.ElementType; label: string; count: string }[] = [
    { id: "x",        icon: XIcon,         label: "x",        count: `(${counts("x")})` },
    { id: "linkedin", icon: AtSign,        label: "linkedin", count: `(${counts("linkedin")})` },
    { id: "reddit",   icon: MessageCircle, label: "reddit",   count: `(${counts("reddit")})` },
  ];

  const visibleLeads = platformLeads[platform];
  const hotCount = leads.filter(l => l.intent_level === "high").length;
  const warmCount = leads.filter(l => l.intent_level === "medium").length;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#E7E5E0] bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#E7E5E0] bg-[#FAFAF7]/60 px-5 py-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
            <span>card 02</span>
            <span className="text-[#A3A3A3]">·</span>
            <span className="flex items-center gap-1 text-[#15803D]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#15803D]" /> live · inbound signals
            </span>
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[#171717]">warm-lead inbox</h2>
          <p className="mt-1 font-mono text-[11px] text-[#737373]">
            {loading ? "loading leads…" : leads.length > 0
              ? `${leads.length} leads found · ${hotCount} hot · ${warmCount} warm`
              : "no leads yet — scanner runs every 30 min"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11.5px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
            <Filter className="h-3 w-3" /> filter
          </button>
          <button onClick={() => { setLoading(true); fetch(`/api/extension/intent-leads?playbookId=${playbookId}`).then(r => r.json()).then(j => setLeads(j.leads ?? [])).catch(() => {}).finally(() => setLoading(false)); }}
            className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11.5px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
            <RotateCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> refresh
          </button>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E7E5E0] px-5 py-3">
        <PlatformTabs value={platform} onChange={setPlatform} items={tabs} />
        <span className="font-mono text-[10.5px] text-[#737373]">top 3 per platform</span>
      </div>

      {/* Lead list */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 font-mono text-[12px] text-[#737373]">
            <Loader2 className="h-4 w-4 animate-spin" /> loading leads…
          </div>
        ) : visibleLeads.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-mono text-[13px] text-[#737373]">no leads yet for {platform === "x" ? "X" : platform}.</p>
            <p className="mt-1 font-mono text-[11px] text-[#A3A3A3]">scanner runs every 30 min.</p>
          </div>
        ) : (
          visibleLeads.map(l => (
            <DashboardLeadCard key={l.id} lead={l} playbook={playbook} onNavigate={onNavigate} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#E7E5E0] bg-[#FAFAF7]/60 px-5 py-3">
        <span className="font-mono text-[10.5px] text-[#737373]">
          showing {visibleLeads.length} of {leads.length} total
        </span>
        <button onClick={() => onNavigate("leads")}
          className="flex items-center gap-1.5 font-mono text-[11.5px] text-[#D84111] hover:text-[#F04E23]">
          view all leads <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ active, onChange }: { active: MainTab; onChange: (t: MainTab) => void }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[60px] shrink-0 flex-col items-center border-r border-[#E7E5E0] bg-[#FAFAF7]">
      <div className="flex h-14 w-full items-center justify-center border-b border-[#E7E5E0]">
        <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-md bg-[#171717]">
          <Zap className="h-4 w-4 text-white" strokeWidth={2} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1 py-4">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button key={id} title={label} onClick={() => onChange(id)}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-md transition-colors
                ${isActive ? "bg-[#171717] text-white" : "text-[#737373] hover:bg-[#F6F4EF] hover:text-[#171717]"}`}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {isActive && <span className="absolute -left-[1px] top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-[#F04E23]" />}
              <span className="pointer-events-none absolute left-[52px] z-50 hidden whitespace-nowrap rounded-md bg-[#171717] px-2 py-1 font-mono text-[10.5px] text-white group-hover:block">
                {label.toLowerCase()}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-2 pb-4">
        <Link href="/dashboard" title="All Playbooks"
          className="group relative flex h-9 w-9 items-center justify-center rounded-md text-[#737373] transition-colors hover:bg-[#F6F4EF] hover:text-[#171717]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          <span className="pointer-events-none absolute left-[52px] z-50 hidden whitespace-nowrap rounded-md bg-[#171717] px-2 py-1 font-mono text-[10.5px] text-white group-hover:block">
            all playbooks
          </span>
        </Link>
      </div>
    </aside>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────────────────

function TopBar({ section, onShare, isSharing, shareLinkCopied, onExportPDF, onExportAll, isExportingAll }: {
  section: string; onShare: () => void; isSharing: boolean; shareLinkCopied: boolean;
  onExportPDF: () => void; onExportAll: () => void; isExportingAll: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#E7E5E0] bg-[#FAFAF7]/90 px-8 backdrop-blur">
      <div className="flex items-center gap-6">
        <div className="flex items-baseline gap-2">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-[#171717]">farcast</Link>
          <span className="font-mono text-[11px] text-[#A3A3A3]">/</span>
          <span className="text-[13px] lowercase text-[#737373]">{section}</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#BBF7D0] bg-[#ECFDF3] px-2 py-[3px] font-mono text-[10.5px] text-[#15803D]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#15803D]" />
            autopilot · on
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onShare} disabled={isSharing}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-3 text-[12.5px] text-[#3F3F3F] hover:bg-[#F6F4EF] disabled:opacity-50">
          {shareLinkCopied ? <><Check className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">Link copied!</span></> : <><Share2 className="h-3.5 w-3.5" />Share</>}
        </button>
        <button onClick={onExportPDF}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-3 text-[12.5px] text-[#3F3F3F] hover:bg-[#F6F4EF]">
          <Download className="h-3.5 w-3.5" />Export PDF
        </button>
        <button onClick={onExportAll} disabled={isExportingAll}
          className="flex h-8 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-[#171717] px-3 text-[12.5px] text-white hover:bg-[#3F3F3F] disabled:opacity-70">
          <BookBook className="h-3.5 w-3.5" />{isExportingAll ? "Preparing…" : "Export Playbook"}
        </button>
        <a href="https://chromewebstore.google.com/detail/farcast/ljapoonogaahmkkmgbhgielehljmjooa?utm_source=item-share-cb"
          target="_blank" rel="noopener noreferrer"
          className="flex h-8 items-center gap-1.5 rounded-md bg-[#F04E23] px-3 text-[12.5px] font-medium text-white ring-1 ring-inset ring-[#D84111] hover:bg-[#D84111]">
          download extension
        </a>
      </div>
    </header>
  );
}

// ── StatusBar ──────────────────────────────────────────────────────────────────

function StatusBar() {
  return (
    <footer className="sticky bottom-0 z-20 flex h-9 shrink-0 items-center justify-between border-t border-[#E7E5E0] bg-[#FAFAF7]/95 px-8 font-mono text-[10.5px] text-[#737373] backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#15803D]" />autopilot active
        </span>
        <span className="text-[#A3A3A3]">·</span>
        <span>extension · v 1.8.2</span>
      </div>
      <span>export pdf <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[4px] bg-white px-1 text-[10.5px] text-[#737373] ring-1 ring-inset ring-[#E7E5E0]">⌘P</kbd></span>
    </footer>
  );
}

// ── DashboardView ─────────────────────────────────────────────────────────────

function DashboardView({ playbook, playbookId, onNavigate }: {
  playbook: Playbook; playbookId: string; onNavigate: (tab: MainTab) => void;
}) {
  const today = new Date();
  const fmt = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const hour = today.getHours();
  const greeting = hour < 12 ? "good morning" : hour < 17 ? "good afternoon" : "good evening";

  const stats = [
    { k: "primary icp",     v: playbook.icp?.title?.split(",")[0] ?? "—", icon: Users,     tab: "icp" as MainTab },
    { k: "channels mapped", v: String(playbook.channels?.length ?? 0),    icon: Network,   tab: "channels" as MainTab },
    { k: "market trend",    v: playbook.marketSizing?.trendDirection ?? "growing", icon: TrendingUp, tab: "overview" as MainTab },
    { k: "top channel",     v: playbook.channels?.[0]?.name ?? "—",       icon: BarChart2, tab: "channels" as MainTab },
  ];

  return (
    <>
      <section className="px-8 pb-8 pt-8">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#737373]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04E23]" />
          daily growth plan · {fmt.toLowerCase()}
        </div>
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
          {greeting},{" "}
          <span className="text-[#737373]">here&apos;s today&apos;s growth plan.</span>
        </h1>
        <p className="mt-3 max-w-[640px] font-mono text-[12px] leading-relaxed text-[#737373]">
          {playbook.productName} · {playbook.summary?.slice(0, 140)}{(playbook.summary?.length ?? 0) > 140 ? "…" : ""}
        </p>
      </section>

      <main className="flex flex-col gap-6 px-8 pb-12">
        {/* Stats row */}
        <div className="flex flex-wrap items-stretch rounded-lg border border-[#E7E5E0] bg-white">
          {stats.map((s, i) => (
            <button key={s.k} onClick={() => onNavigate(s.tab)}
              className={`flex min-w-[180px] flex-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-[#F6F4EF]
                ${i !== 0 ? "border-l border-[#E7E5E0]" : ""}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F6F4EF] text-[#3F3F3F]">
                <s.icon className="h-[15px] w-[15px]" strokeWidth={1.6} />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[15px] font-semibold capitalize tracking-tight text-[#171717]">{s.v}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">{s.k}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Card 01 + Card 02 */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
          <HermesDailyQueueCard playbookId={playbookId} />
          <DashboardWarmLeadsCard playbookId={playbookId} playbook={playbook} onNavigate={onNavigate} />
        </div>
      </main>
    </>
  );
}

// ── Content Engine sub-tabs ────────────────────────────────────────────────────

function ContentSubTabs({ active, onChange }: { active: ContentSubTab; onChange: (t: ContentSubTab) => void }) {
  const tabs = [
    { id: "weekly-engine" as ContentSubTab, label: "Weekly Content Engine", icon: CalendarDays },
    { id: "weekly-ideas" as ContentSubTab,  label: "Content Ideas",         icon: Lightbulb },
  ];
  return (
    <div className="mb-6 flex items-center gap-1 border-b border-[#E7E5E0]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)}
          className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors
            ${active === id ? "border-[#F04E23] text-[#F04E23]" : "border-transparent text-[#737373] hover:text-[#171717]"}`}>
          <Icon className="h-3.5 w-3.5" />{label}
        </button>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function PlaybookDashboard({ playbookId }: { playbookId: string }) {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>("weekly-engine");
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/playbooks/${playbookId}/share`, { method: "POST" });
      const json = await res.json();
      if (json.shareUrl) {
        await navigator.clipboard.writeText(json.shareUrl);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 3000);
      }
    } finally { setIsSharing(false); }
  };

  useEffect(() => {
    async function load() {
      const raw = localStorage.getItem(`playbook_${playbookId}`);
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          const candidate = stored.playbook ?? stored;
          setPlaybook(candidate.playbook ?? candidate);
          return;
        } catch {}
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("playbooks").select("data").eq("id", playbookId).single();
      if (data?.data) {
        const raw2 = data.data as any;
        const p = raw2.playbook ?? raw2;
        setPlaybook(p as Playbook);
        localStorage.setItem(`playbook_${playbookId}`, JSON.stringify({ playbook: p, formData: {} }));
      } else {
        router.push("/dashboard");
      }
    }
    load();
  }, [playbookId, router]);

  useEffect(() => {
    if (!isExportingAll) return;
    const handleAfterPrint = () => { document.body.classList.remove("print-all-mode"); setIsExportingAll(false); };
    window.addEventListener("afterprint", handleAfterPrint);
    const t = window.setTimeout(() => { document.body.classList.add("print-all-mode"); window.print(); }, 350);
    return () => { window.clearTimeout(t); window.removeEventListener("afterprint", handleAfterPrint); document.body.classList.remove("print-all-mode"); };
  }, [isExportingAll]);

  if (!playbook) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F04E23]" style={{ borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-[#FAFAF7] text-[#171717] print-normal-root">
        <Sidebar active={activeTab} onChange={setActiveTab} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            section={SECTION_LABEL[activeTab]}
            onShare={handleShare}
            isSharing={isSharing}
            shareLinkCopied={shareLinkCopied}
            onExportPDF={() => window.print()}
            onExportAll={() => setIsExportingAll(true)}
            isExportingAll={isExportingAll}
          />
          <div className="flex-1">
            {activeTab === "dashboard" && (
              <DashboardView playbook={playbook} playbookId={playbookId} onNavigate={setActiveTab} />
            )}
            {activeTab !== "dashboard" && (
              <div className="mx-auto max-w-[1480px] px-8 py-8">
                <div className="rounded-3xl border border-[#E7E5E0] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
                  {activeTab === "overview" && <PlaybookOverview playbook={playbook} />}
                  {activeTab === "icp" && <PlaybookICP icp={playbook.icp} />}
                  {activeTab === "channels" && <PlaybookChannels playbookId={playbook.id} channels={playbook.channels} />}
                  {activeTab === "rivals" && <RivalSpying playbookId={playbookId} productName={playbook.productName} productDescription={playbook.summary} />}
                  {activeTab === "queue" && <QueueManager playbookId={playbookId} />}
                  {activeTab === "leads" && <WarmLeads playbookId={playbookId} productName={playbook.productName} productDescription={playbook.summary} icp={playbook.icp} />}
                  {activeTab === "growth-hacks" && <GrowthHacks playbookId={playbookId} productName={playbook.productName} productDescription={playbook.summary} icp={playbook.icp} />}
                  {activeTab === "posts" && (
                    <>
                      <ContentSubTabs active={contentSubTab} onChange={setContentSubTab} />
                      {contentSubTab === "weekly-engine" && <WeeklyContentEngine playbook={playbook} />}
                      {contentSubTab === "weekly-ideas" && <WeeklyContentIdeas playbook={playbook} />}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <StatusBar />
        </div>
      </div>
      {isExportingAll && <PlaybookPrintView playbook={playbook} />}
    </>
  );
}

// ── Tiny alias to avoid import collision with BookOpen ─────────────────────────
const BookBook = BookOpen;
