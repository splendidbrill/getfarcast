"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { Playbook, GrowthHack } from "@/lib/types";
import { SchedulePost } from "@/components/SchedulePost";

// ── Types ────────────────────────────────────────────────────────────────────

interface Post {
  type: "gyaan" | "story" | "trending" | "reddit_subreddit";
  title?: string;
  content: string;
  subreddit?: string;
  flair?: string;
  instructions?: string;
  strategy?: "pure_value" | "seeded";
}

interface ChannelContent {
  channelName: string;
  posts: Post[];
}

type Lead = {
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
};

type LeadPlatform = "twitter_x" | "linkedin" | "reddit";

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storageKey(id: string) {
  return `tier1_content_${id}_${todayStr()}`;
}

function buildIcpSummary(p: Playbook) {
  const icp = p.icp;
  if (!icp?.title) return `Product: ${p.productName}. ${(p as any).productDescription ?? p.summary ?? ""}`;
  return `${icp.title}. ${icp.summary ?? ""} Pain points: ${(icp.painPoints ?? []).slice(0, 3).join(", ")}.`;
}

function countStreak(id: string): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = `tier1_content_${id}_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (localStorage.getItem(k)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

const POST_ANGLE: Record<string, string> = {
  gyaan: "Insight / Quote",
  story: "Founder Story",
  trending: "Trending Hook",
  reddit_subreddit: "Reddit Value Post",
};

const CHAR_LIMIT: Record<string, number> = {
  "X (Twitter)": 280,
  LinkedIn: 3000,
  Reddit: 40000,
};

// ── SVG Icons (matching design file) ─────────────────────────────────────────

function Ico({ d, size = 16, sw = 1.6, fill = "none", cls = "" }: {
  d: React.ReactNode; size?: number; sw?: number; fill?: string; cls?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>
      {d}
    </svg>
  );
}

const IC = {
  copy:    <Ico d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>} />,
  ext:     <Ico d={<><path d="M14 4h6v6"/><path d="M10 14L20 4"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></>} />,
  check:   <Ico d={<><path d="M5 12l4 4 10-10"/></>} />,
  refresh: <Ico d={<><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></>} />,
  flame:   <Ico d={<><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 10 8 12 8 14a4 4 0 0 0 8 0"/></>} fill="currentColor" sw={0} />,
  warn:    <Ico d={<><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".8" fill="currentColor"/></>} />,
  globe:   <Ico d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/></>} />,
  trend:   <Ico d={<><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></>} />,
  arrow:   <Ico d={<><path d="M5 12h14M13 5l7 7-7 7"/></>} />,
  send:    <Ico d={<><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>} />,
  sparkle: <Ico d={<><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></>} />,
  spark:   <Ico d={<><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></>} />,
  reddit:  <Ico size={15} d={<><circle cx="12" cy="13" r="8"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M9 16.5c1 .8 4 .8 6 0"/><circle cx="18" cy="6" r="1.5"/><path d="M12 5l1.5-2 4 1"/></>} />,
  xtwit:   <Ico size={14} d={<><path d="M4 4l16 16M20 4L4 20"/></>} sw={2} />,
  linkedin:<Ico size={14} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 13v4"/></>} />,
};

// ── Platform Tab ──────────────────────────────────────────────────────────────

function PTab({ active, onClick, icon, label, count, rateLimit }: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; count: number; rateLimit?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium transition-all
        ${active
          ? "bg-[#F25C2C] text-white shadow-[0_2px_6px_-1px_rgba(242,92,44,0.45)]"
          : "bg-white text-slate-600 hover:bg-slate-50 border border-[#E2E8F0]"}`}
    >
      <span className={active ? "text-white" : "text-slate-400"}>{icon}</span>
      <span>{label}</span>
      <span className={`text-[12px] tabular-nums ${active ? "text-white/80" : "text-slate-400"}`}>({count})</span>
      {rateLimit && (
        <span className={`ml-1 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded
          ${active ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"}`}>
          rate-limited
        </span>
      )}
    </button>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, platform, idx, total }: { post: Post; platform: string; idx: number; total: number }) {
  const raw = post.title ? `${post.title}\n\n${post.content}` : post.content;
  const [text, setText] = useState(raw);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setText(post.title ? `${post.title}\n\n${post.content}` : post.content); }, [post]);

  const limit = CHAR_LIMIT[platform] ?? 3000;
  const over = text.length > limit;
  const short = platform === "X (Twitter)" ? "X" : platform;
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-slate-400">{String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
          <span className="w-px h-3.5 bg-[#E2E8F0]" />
          <span className="text-[12px] text-slate-500">angle:</span>
          <span className="text-[12px] font-medium text-slate-800">{POST_ANGLE[post.type] ?? post.type}</span>
          {post.subreddit && (
            <><span className="w-px h-3.5 bg-[#E2E8F0]" /><span className="text-[12px] font-mono text-orange-600">r/{post.subreddit}</span></>
          )}
        </div>
        <div className={`text-[11px] font-mono tabular-nums ${over ? "text-rose-500" : "text-slate-400"}`}>
          {text.length}/{limit}
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full px-4 py-3.5 text-[14px] leading-[1.55] text-slate-800 bg-transparent resize-none focus:outline-none"
        rows={Math.max(4, Math.min(14, text.split("\n").length + 1))}
      />

      <div className="flex items-center justify-between px-3 py-3 border-t border-[#E2E8F0] bg-[#FAFAF7]/60 rounded-b-xl">
        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
          <span className="px-2 py-1 rounded-md bg-white border border-[#E2E8F0] font-mono text-slate-500">⌘K</span>
          <span>regenerate</span>
        </div>
        <button onClick={handleCopy}
          className={`flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium transition-all
            ${copied
              ? "bg-emerald-500 text-white"
              : "bg-[#F25C2C] text-white hover:bg-[#E0501F] shadow-[0_2px_8px_-2px_rgba(242,92,44,0.6)]"}`}
        >
          {copied ? <>{IC.check}<span>copied!</span></> : <>{IC.copy}<span>copy {short}</span></>}
        </button>
      </div>
    </div>
  );
}

// ── Outbound Engine ───────────────────────────────────────────────────────────

type ContentTab = "X (Twitter)" | "LinkedIn" | "Reddit";

function OutboundEngine({ playbook, playbookId }: { playbook: Playbook; playbookId: string }) {
  const [tab, setTab] = useState<ContentTab>("X (Twitter)");
  const [draftIdx, setDraftIdx] = useState(0);
  const [content, setContent] = useState<ChannelContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [regen, setRegen] = useState<string | null>(null);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = localStorage.getItem(storageKey(playbookId));
    if (s) try { setContent(JSON.parse(s)); } catch {}
  }, [playbookId]);

  useEffect(() => { setDraftIdx(0); }, [tab]);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      iv.current = setInterval(() => setProgress(p => { if (p >= 85) { clearInterval(iv.current!); return 85; } return p + Math.random() * 6 + 2; }), 400);
    } else {
      clearInterval(iv.current!);
      if (progress > 0) { setProgress(100); setTimeout(() => setProgress(0), 600); }
    }
    return () => clearInterval(iv.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const callAPI = useCallback(async (channels: string[]): Promise<ChannelContent[]> => {
    const r = await fetch("/api/generate-tier1-content", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedChannels: channels,
        productName: playbook.productName || "My Product",
        productDescription: (playbook as any).productDescription || playbook.summary || "",
        icpSummary: buildIcpSummary(playbook),
        playbookId: playbook.id,
      }),
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Generation failed"); }
    return (await r.json()).channels as ChannelContent[];
  }, [playbook]);

  const save = (c: ChannelContent[]) => localStorage.setItem(storageKey(playbookId), JSON.stringify(c));

  const handleGenerate = async () => {
    setLoading(true); setError("");
    try { const c = await callAPI(["X (Twitter)", "LinkedIn", "Reddit"]); setContent(c); save(c); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleRegen = async (ch: string) => {
    setRegen(ch); setError("");
    try {
      const fresh = await callAPI([ch]);
      const updated = content.map(c => c.channelName === ch ? fresh[0] : c);
      if (!updated.find(c => c.channelName === ch)) updated.push(fresh[0]);
      setContent(updated); save(updated);
    } catch (e) { setError(e instanceof Error ? e.message : "Regeneration failed."); }
    finally { setRegen(null); }
  };

  const posts = content.find(c => c.channelName === tab)?.posts ?? [];
  const counts = {
    "X (Twitter)": content.find(c => c.channelName === "X (Twitter)")?.posts.length ?? 0,
    LinkedIn: content.find(c => c.channelName === "LinkedIn")?.posts.length ?? 0,
    Reddit: content.find(c => c.channelName === "Reddit")?.posts.length ?? 0,
  };

  return (
    <section className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-slate-400">card 01</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-[#E55A24]">outbound engine</span>
            </div>
            <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 lowercase">today's growth engine</h2>
          </div>
          {content.length > 0 && (
            <button onClick={() => handleRegen(tab)} disabled={regen === tab}
              className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50">
              <span className={regen === tab ? "[&>svg]:animate-spin" : ""}>{IC.refresh}</span>
              regenerate
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PTab active={tab === "X (Twitter)"} onClick={() => setTab("X (Twitter)")} icon={IC.xtwit} label="X" count={counts["X (Twitter)"]} />
          <PTab active={tab === "LinkedIn"} onClick={() => setTab("LinkedIn")} icon={IC.linkedin} label="LinkedIn" count={counts.LinkedIn} />
          <PTab active={tab === "Reddit"} onClick={() => setTab("Reddit")} icon={IC.reddit} label="Reddit" count={counts.Reddit} rateLimit />
        </div>
      </div>

      <div className="p-6 space-y-4 bg-[#FBFAF7]">
        {tab === "Reddit" && content.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex gap-3">
            <div className="text-amber-600 mt-0.5">{IC.warn}</div>
            <div>
              <div className="text-[13.5px] font-semibold text-amber-900">Max 3–4 Reddit posts per WEEK to avoid bans.</div>
              <div className="text-[12.5px] text-amber-800/90 mt-0.5">Lead with value, drop the link only if asked. Reddit weights account age, karma velocity, and link-to-content ratio.</div>
            </div>
          </div>
        )}

        {content.length === 0 ? (
          <div className="py-12 text-center space-y-5">
            <div className="w-12 h-12 bg-[#F25C2C]/10 rounded-2xl flex items-center justify-center mx-auto text-[#F25C2C]">
              {IC.spark}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900 mb-1">no posts yet today</p>
              <p className="text-[13px] text-slate-500">generate posts for X, LinkedIn, and Reddit in one shot.</p>
            </div>
            <button onClick={handleGenerate} disabled={loading}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-[#F25C2C]">{IC.spark}</span>}
              {loading ? "generating posts…" : "generate today's posts"}
            </button>
            {progress > 0 && (
              <div className="max-w-xs mx-auto space-y-1.5">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F25C2C] to-[#FF7A3D] rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <p className="text-[11.5px] text-slate-400 font-mono">writing posts for 3 channels…</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {(posts.length > 1 || tab !== "Reddit") && posts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {posts.length > 1 && (
                  <>
                    {posts.map((_, i) => (
                      <button key={i} onClick={() => setDraftIdx(i)}
                        className={`h-7 px-3 rounded-md text-[12px] font-mono tabular-nums transition-colors
                          ${i === draftIdx ? "bg-slate-900 text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:text-slate-900"}`}>
                        draft {String(i + 1).padStart(2, "0")}
                      </button>
                    ))}
                    <span className="ml-2 text-[12px] text-slate-400">← cycle drafts</span>
                  </>
                )}
                {tab !== "Reddit" && (
                  <>
                    {posts.length > 1 && <span className="w-px h-4 bg-[#E2E8F0] mx-1" />}
                    <SchedulePost
                      content={posts[draftIdx]
                        ? (posts[draftIdx].title
                            ? `${posts[draftIdx].title}\n\n${posts[draftIdx].content}`
                            : posts[draftIdx].content)
                        : ""}
                      platform={tab === "X (Twitter)" ? "twitter" : "linkedin"}
                      playbookId={playbookId}
                    />
                  </>
                )}
              </div>
            )}
            {posts[draftIdx] && <PostCard post={posts[draftIdx]} platform={tab} idx={draftIdx} total={posts.length} />}
          </>
        )}
        {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
      </div>
    </section>
  );
}

// ── Lead Radar ────────────────────────────────────────────────────────────────

function LeadRow({ lead, platform }: { lead: Lead; platform: LeadPlatform }) {
  const [dmSent, setDmSent] = useState(false);
  const icon = { reddit: IC.reddit, twitter_x: IC.xtwit, linkedin: IC.linkedin }[platform];
  const color = { reddit: "text-[#FF4500]", twitter_x: "text-slate-900", linkedin: "text-[#0A66C2]" }[platform];

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 ${color}`}>{icon}</span>
          <span className="text-[13px] font-semibold text-slate-900 truncate">{lead.username_or_name}</span>
          {lead.intent_level === "high" && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-semibold uppercase tracking-wide shrink-0">
              <span className="w-3 h-3">{IC.flame}</span>hot
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
          {lead.lead_score != null && <span className="font-mono tabular-nums">{lead.lead_score}</span>}
          {(lead.seen_count ?? 0) > 1 && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">×{lead.seen_count}</span>
          )}
        </div>
      </div>
      {lead.bio_or_headline && <p className="text-[11px] text-slate-500 mb-1.5">{lead.bio_or_headline}</p>}
      {lead.matched_text_preview && (
        <p className="text-[12.5px] leading-[1.5] text-slate-600 italic mb-3 line-clamp-3">{lead.matched_text_preview}</p>
      )}
      <div className="flex items-center gap-1.5">
        <a href={lead.profile_url} target="_blank" rel="noopener noreferrer"
          className="flex-1 h-8 rounded-md border border-[#E2E8F0] bg-white text-slate-700 text-[12px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
          profile<span className="text-slate-400">{IC.ext}</span>
        </a>
        {lead.source_url && (
          <a href={lead.source_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 h-8 rounded-md border border-[#E2E8F0] bg-white text-slate-700 text-[12px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
            post<span className="text-slate-400">{IC.ext}</span>
          </a>
        )}
        <button onClick={() => setDmSent(true)}
          className={`flex-1 h-8 rounded-md text-[12px] font-medium transition-all flex items-center justify-center gap-1
            ${dmSent ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
          {dmSent ? <>{IC.check}sent</> : "dm"}
        </button>
      </div>
    </div>
  );
}

function LeadRadar({ playbookId, onCount }: { playbookId: string; onCount: (n: number) => void }) {
  const [tab, setTab] = useState<LeadPlatform>("twitter_x");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/extension/intent-leads?playbookId=${playbookId}`)
      .then(r => r.json())
      .then(j => { setLeads(j.leads ?? []); onCount((j.leads ?? []).length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playbookId, onCount]);

  const by = (p: LeadPlatform) => leads.filter(l => l.platform === p).slice(0, 5);
  const counts = { twitter_x: leads.filter(l => l.platform === "twitter_x").length, reddit: leads.filter(l => l.platform === "reddit").length, linkedin: leads.filter(l => l.platform === "linkedin").length };
  const TABS = [{ id: "twitter_x" as LeadPlatform, icon: IC.xtwit, label: "X" }, { id: "reddit" as LeadPlatform, icon: IC.reddit, label: "Reddit" }, { id: "linkedin" as LeadPlatform, icon: IC.linkedin, label: "LinkedIn" }];

  return (
    <section className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-slate-400">card 02</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] font-mono text-emerald-600">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-60" /><span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                live
              </span>
            </div>
            <h2 className="text-[18px] font-semibold tracking-tight text-slate-900 lowercase">new leads found today</h2>
          </div>
          <button className="text-slate-400 hover:text-slate-700 transition-colors p-1.5">{IC.refresh}</button>
        </div>
        <div className="flex items-center gap-1.5">
          {TABS.map(({ id, icon, label }) => {
            const active = tab === id; const count = counts[id]; const empty = count === 0;
            return (
              <button key={id} onClick={() => !empty && setTab(id)} disabled={empty}
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] font-medium transition-colors
                  ${active ? "bg-[#F25C2C] text-white" : empty ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50 border border-[#E2E8F0]"}`}>
                <span className={active ? "text-white" : empty ? "text-slate-300" : "text-slate-500"}>{icon}</span>
                <span>{label}</span>
                <span className={`tabular-nums ${active ? "text-white/80" : "text-slate-400"}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 480 }}>
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
        ) : by(tab).length === 0 ? (
          <div className="py-12 text-center"><div className="text-[13px] text-slate-400 mb-1">no leads yet today.</div><div className="text-[11.5px] text-slate-400">scanner runs every 30 min.</div></div>
        ) : by(tab).map(l => <LeadRow key={l.id} lead={l} platform={tab} />)}
      </div>
      <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-[#FBFAF7] flex items-center justify-between text-[11.5px]">
        <span className="text-slate-500">top 5 per platform shown</span>
        <span className="text-[#E55A24] font-medium flex items-center gap-1 cursor-pointer hover:underline">view all leads {IC.arrow}</span>
      </div>
    </section>
  );
}

// ── Hack Card ─────────────────────────────────────────────────────────────────

function HackCard({ playbookId }: { playbookId: string }) {
  const [hack, setHack] = useState<GrowthHack | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(`growth_hacks_${playbookId}`);
    if (!cached) return;
    try {
      const hacks: GrowthHack[] = JSON.parse(cached);
      if (hacks.length) setHack(hacks[Math.floor(Date.now() / 86400000) % hacks.length]);
    } catch {}
  }, [playbookId]);

  const effortCls: Record<string, string> = {
    low: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    medium: "bg-amber-50 text-amber-700 border border-amber-100",
    high: "bg-red-50 text-red-700 border border-red-100",
  };

  if (!hack) return (
    <section className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5">
      <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-slate-400 mb-1">card 03 · randomized daily</div>
      <h2 className="text-[18px] font-semibold tracking-tight text-slate-900 lowercase mb-3">growth hack of the day</h2>
      <p className="text-[13px] text-slate-400">No hacks generated yet — go to the Growth Hacks tab to generate some.</p>
    </section>
  );

  return (
    <section className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-5 pt-5 pb-3 bg-gradient-to-br from-[#FFF6EE] via-[#FFFBF7] to-white border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-slate-400">card 03</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-[#E55A24]">randomized daily</span>
        </div>
        <h2 className="text-[18px] font-semibold tracking-tight text-slate-900 lowercase mb-3">growth hack of the day</h2>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#F25C2C] shrink-0 shadow-sm">{IC.trend}</div>
          <div className="min-w-0">
            <h3 className="text-[15.5px] font-semibold text-slate-900 leading-snug">{hack.title}</h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${effortCls[hack.effort] ?? effortCls.medium}`}>{hack.effort} effort</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-medium border border-blue-100 flex items-center gap-1">
                <span className="w-3 h-3">{IC.globe}</span>{hack.type}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{hack.platform}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-[13px] leading-[1.55] text-slate-600 mb-4">{hack.description}</p>
        <ol className="space-y-2 mb-4">
          {hack.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-md bg-slate-900 text-white text-[10.5px] font-mono flex items-center justify-center mt-0.5">{i + 1}</span>
              <span className="text-[12.5px] leading-[1.55] text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-[#FBFAF7] border border-[#E2E8F0]">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-mono mb-0.5">days to first user</div>
            <div className="text-[15px] font-semibold text-slate-900 tabular-nums">{hack.timeToFirstUser}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-mono mb-0.5">expected result</div>
            <div className="text-[13px] font-semibold text-slate-900 leading-tight">{hack.expectedResult}</div>
          </div>
        </div>
        <button className="w-full h-10 rounded-lg bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
          where exactly: {hack.where.slice(0, 40)}{hack.where.length > 40 ? "…" : ""} {IC.arrow}
        </button>
      </div>
    </section>
  );
}

// ── Daily Log ─────────────────────────────────────────────────────────────────

function DailyLog({ playbookId }: { playbookId: string }) {
  const KEY = `daily_log_${playbookId}_${todayStr()}`;
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiReply, setAiReply] = useState<string | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) { setText(s); setSaved(true); setAiReply("logged. i'll lean into this in tomorrow's drafts."); } } catch {}
  }, [KEY]);

  const PROMPTS = ["shipped a new feature", "got my first reply on X", "no leads today", "first paying user from Reddit"];

  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      localStorage.setItem(KEY, text);
      await new Promise(r => setTimeout(r, 600));
      setAiReply("logged. i'll adjust tomorrow's drafts based on what you shared — angle, tone, and which platforms to lean into.");
      setSaved(true);
    } finally { setLoading(false); }
  };

  return (
    <section className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-slate-400">card 04</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-[#E55A24]">personalization loop</span>
        </div>
        <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 lowercase">the daily log</h2>
        <p className="text-[13px] text-slate-500 mt-0.5 max-w-xl">wins, losses, key learnings — anything from today. our AI uses this to personalize tomorrow's content to your unique founder story.</p>
      </div>
      <div className="p-6">
        <div className="grid md:grid-cols-[1fr_280px] gap-5">
          <div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#FBFAF7] focus-within:border-slate-300 focus-within:bg-white transition-colors">
              <textarea value={text} onChange={e => { setText(e.target.value); setSaved(false); setAiReply(null); }}
                placeholder="today i…" rows={6}
                className="w-full px-5 py-4 bg-transparent resize-none focus:outline-none text-[14.5px] leading-[1.6] text-slate-800 placeholder-slate-400" />
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PROMPTS.map(p => (
                    <button key={p} onClick={() => { setText(p); setSaved(false); setAiReply(null); }}
                      className="text-[11.5px] px-2 py-1 rounded-md border border-[#E2E8F0] bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors">{p}</button>
                  ))}
                </div>
                <div className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0 ml-2">{text.length} chars</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-[11.5px] text-slate-400">private. used only for your model.</div>
              <button onClick={handleSave} disabled={!text.trim() || loading}
                className={`flex items-center gap-2 h-10 px-5 rounded-lg text-[13px] font-medium transition-all
                  ${!text.trim() ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : saved ? "bg-emerald-500 text-white"
                    : "bg-[#F25C2C] text-white hover:bg-[#E0501F] shadow-[0_2px_8px_-2px_rgba(242,92,44,0.6)]"}`}>
                {loading ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />thinking…</>
                  : saved ? <>{IC.check}reflection saved</>
                  : <>{IC.send}save reflection</>}
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#FFB088]">{IC.sparkle}</span>
              <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-white/60">tomorrow's adjustment</span>
            </div>
            {aiReply
              ? <p className="text-[13px] leading-[1.6] text-white/90">{aiReply}</p>
              : <p className="text-[13px] leading-[1.6] text-white/60">log a reflection and i'll adjust tomorrow's drafts — angle, tone, which platforms to lean into.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stat Block ────────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="text-center min-w-[56px]">
      <div className={`text-[20px] font-semibold tabular-nums leading-none ${accent ? "text-[#F25C2C]" : "text-slate-900"}`}>{value}</div>
      <div className="text-[10.5px] uppercase tracking-wide text-slate-400 mt-1.5 font-mono">{label}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DailyTodo({ playbook, playbookId }: { playbook: Playbook; playbookId: string }) {
  const [leadsCount, setLeadsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const s = localStorage.getItem(storageKey(playbookId));
    if (s) try { setPostsCount((JSON.parse(s) as ChannelContent[]).reduce((a, c) => a + c.posts.length, 0)); } catch {}
    setStreak(countStreak(playbookId));
  }, [playbookId]);

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Top banner */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase tracking-[0.14em] font-mono text-[#E55A24]">daily growth plan</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] uppercase tracking-[0.14em] font-mono text-slate-400">{dateStr}</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 leading-tight">
            good morning.{" "}<span className="text-slate-400">here's today's growth plan.</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 px-5 py-3 rounded-xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Stat label="posts drafted" value={postsCount} accent />
          <span className="w-px h-9 bg-[#E2E8F0]" />
          <Stat label="warm leads" value={leadsCount} />
          <span className="w-px h-9 bg-[#E2E8F0]" />
          <Stat label="streak" value={streak} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <OutboundEngine playbook={playbook} playbookId={playbookId} />
        </div>
        <div className="space-y-5">
          <LeadRadar playbookId={playbookId} onCount={setLeadsCount} />
          <HackCard playbookId={playbookId} />
        </div>
        <div className="lg:col-span-3">
          <DailyLog playbookId={playbookId} />
        </div>
      </div>
    </div>
  );
}
