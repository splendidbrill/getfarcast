"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles, Loader2, RotateCw, Check, Copy, ChevronDown,
  X as XIcon, AtSign, MessageCircle, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Platform = "x" | "linkedin" | "reddit";
type QueueStatus = "pending_approval" | "approved" | "published" | "skipped";
type XSlot = "am_hook" | "noon_update" | "pm_reply_bait";
type LinkedInDirective = "framework_teardown" | "vulnerable_retrospective" | "contrarian_operator";

interface QueuePost {
  id: string;
  platform: "x" | "linkedin" | "reddit";
  draft_text: string;
  rationale_tag: string | null;
  voice_fit_score: number | null;
  scheduled_time: string | null;
  status: QueueStatus;
  x_slot: XSlot | null;
  linkedin_directive: LinkedInDirective | null;
  created_at: string;
}

// ── Label maps ─────────────────────────────────────────────────────────────────

const X_SLOT_LABEL: Record<XSlot, string> = {
  am_hook: "am hook",
  noon_update: "noon update",
  pm_reply_bait: "pm reply-bait",
};

const DIRECTIVE_LABEL: Record<LinkedInDirective, string> = {
  framework_teardown: "framework teardown",
  vulnerable_retrospective: "vulnerable retrospective",
  contrarian_operator: "contrarian operator",
};

function slotLabel(post: QueuePost): string {
  if (post.x_slot) return X_SLOT_LABEL[post.x_slot];
  if (post.linkedin_directive) return DIRECTIVE_LABEL[post.linkedin_directive];
  return post.platform;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }) + " UTC";
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function VoiceGauge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "#15803D" : pct >= 70 ? "#F04E23" : "#B45309";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-[100px] overflow-hidden rounded-full bg-[#E7E5E0]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[11px] tabular-nums" style={{ color }}>{pct}</span>
    </div>
  );
}

function PlatformTabs({ value, onChange, items }: {
  value: Platform;
  onChange: (v: Platform) => void;
  items: { id: Platform; icon: React.ElementType; label: string; count: number }[];
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
            {it.count > 0 && (
              <span className={`font-mono text-[10px] ${active ? "text-[#737373]" : "text-[#A3A3A3]"}`}>
                ({it.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Post card ──────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onAction,
  actioning,
}: {
  post: QueuePost;
  onAction: (id: string, status: "approved" | "skipped", text: string) => Promise<void>;
  actioning: boolean;
}) {
  const [text, setText] = useState(post.draft_text);
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setText(post.draft_text); }, [post.draft_text]);

  const charLimit = post.platform === "x" ? 280 : post.platform === "linkedin" ? 3000 : 40000;
  const isApproved = post.status === "approved";
  const isSkipped = post.status === "skipped";

  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`flex flex-col gap-3 rounded-md border bg-white p-4 transition-opacity
      ${isSkipped ? "opacity-40" : ""} ${isApproved ? "border-[#BBF7D0] bg-[#F0FDF4]/60" : "border-[#E7E5E0]"}`}>

      {/* Post meta row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-[5px] bg-[#171717] px-1.5 py-[2px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-white">
            {slotLabel(post)}
          </span>
          {post.scheduled_time && (
            <span className="font-mono text-[10.5px] text-[#737373]">{formatTime(post.scheduled_time)}</span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1 rounded-[5px] border border-[#BBF7D0] bg-[#ECFDF3] px-1.5 py-[2px] font-mono text-[10.5px] text-[#15803D]">
              <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> approved
            </span>
          )}
        </div>
        {post.voice_fit_score != null && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#737373]">voice-fit</span>
            <VoiceGauge value={post.voice_fit_score} />
          </div>
        )}
      </div>

      {/* Rationale */}
      {post.rationale_tag && (
        <div className="rounded-md border border-[#E7E5E0] bg-[#F6F4EF]/60">
          <button
            onClick={() => setRationaleOpen(!rationaleOpen)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2"
          >
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#D84111]">
              ↳ hermes rationale
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#737373] transition-transform ${rationaleOpen ? "" : "-rotate-90"}`} />
          </button>
          {rationaleOpen && (
            <div className="border-t border-[#E7E5E0] px-3 py-2.5">
              <p className="font-mono text-[11.5px] leading-[1.65] text-[#3F3F3F]">{post.rationale_tag}</p>
            </div>
          )}
        </div>
      )}

      {/* Draft textarea */}
      <div className="rounded-md border border-[#E7E5E0]">
        <div className="flex items-center justify-between border-b border-[#E7E5E0] px-3 py-1.5">
          <span className="font-mono text-[10.5px] text-[#737373]">draft</span>
          <span className="font-mono text-[10.5px] tabular-nums">
            <span className={text.length > charLimit * 0.9 ? "text-[#B45309]" : "text-[#737373]"}>{text.length}</span>
            <span className="text-[#A3A3A3]"> / {charLimit}</span>
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSkipped}
          className="w-full resize-none bg-transparent px-4 py-3 font-sans text-[13.5px] leading-[1.6] text-[#171717] focus:outline-none disabled:opacity-50"
          rows={Math.max(3, Math.min(12, text.split("\n").length + 1))}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleCopy}
          className={`flex h-7 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] transition
            ${copied
              ? "border-[#BBF7D0] bg-[#ECFDF3] text-[#15803D]"
              : "border-[#E7E5E0] bg-white text-[#3F3F3F] hover:bg-[#F6F4EF]"}`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>

        <div className="flex items-center gap-2">
          {!isSkipped && !isApproved && (
            <button
              onClick={() => onAction(post.id, "skipped", text)}
              disabled={actioning}
              className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11px] text-[#737373] hover:bg-[#F6F4EF] disabled:opacity-50"
            >
              skip
            </button>
          )}
          {!isApproved && !isSkipped && (
            <button
              onClick={() => onAction(post.id, "approved", text)}
              disabled={actioning}
              className="flex h-7 items-center gap-1.5 rounded-md bg-[#171717] px-2.5 font-mono text-[11px] font-medium text-white hover:bg-[#3F3F3F] disabled:opacity-50"
            >
              {actioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              approve
            </button>
          )}
          {(isApproved || isSkipped) && (
            <button
              onClick={() => onAction(post.id, "pending_approval" as "approved", text)}
              disabled={actioning}
              className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11px] text-[#737373] hover:bg-[#F6F4EF] disabled:opacity-50"
            >
              undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function HermesDailyQueueCard({ playbookId }: { playbookId: string }) {
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [platform, setPlatform] = useState<Platform>("x");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hermes/queue?playbookId=${playbookId}`);
      const json = await res.json();
      setPosts(json.posts ?? []);
    } catch {
      setError("Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }, [playbookId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (generating) {
      setProgress(0);
      iv.current = setInterval(() => setProgress(p => {
        if (p >= 88) { clearInterval(iv.current!); return 88; }
        return p + Math.random() * 5 + 1.5;
      }), 500);
    } else {
      clearInterval(iv.current!);
      if (progress > 0) { setProgress(100); setTimeout(() => setProgress(0), 500); }
    }
    return () => clearInterval(iv.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generating]);

  const handleGenerate = async (force = false) => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/hermes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playbookId, force }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      if (json.alreadyGenerated && !force) {
        setToast("posts already exist today — use force regenerate to replace them");
      } else {
        await fetchPosts();
        setToast(`${json.drafts} posts generated`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (id: string, status: "approved" | "skipped" | "pending_approval", text: string) => {
    setActioningId(id);
    try {
      await fetch("/api/hermes/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, draft_text: text }),
      });
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: status as QueueStatus, draft_text: text } : p));
    } catch {
      setToast("action failed — try again");
    } finally {
      setActioningId(null);
    }
  };

  // Today's posts only (created since midnight UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayPosts = posts.filter(p => new Date(p.created_at) >= todayStart);

  const byPlatform = (p: Platform) => todayPosts.filter(post => post.platform === p);
  const counts = { x: byPlatform("x").length, linkedin: byPlatform("linkedin").length, reddit: byPlatform("reddit").length };
  const totalToday = todayPosts.length;
  const approvedCount = todayPosts.filter(p => p.status === "approved").length;

  const platformPosts = byPlatform(platform);

  const tabs: { id: Platform; icon: React.ElementType; label: string; count: number }[] = [
    { id: "x",        icon: XIcon,         label: "x",        count: counts.x },
    { id: "linkedin", icon: AtSign,        label: "linkedin", count: counts.linkedin },
    { id: "reddit",   icon: MessageCircle, label: "reddit",   count: counts.reddit },
  ];

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-[#E7E5E0] bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#E7E5E0] bg-[#FAFAF7]/60 px-5 py-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#737373]">
            <span>card 01</span>
            <span className="text-[#A3A3A3]">·</span>
            <span className="text-[#D84111]">HERMES DAILY QUEUE</span>
          </div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[#171717]">today&apos;s content queue</h2>
          <p className="mt-1 font-mono text-[11px] text-[#737373]">
            {loading
              ? "loading…"
              : totalToday > 0
              ? `${totalToday} drafts ready · ${approvedCount} approved`
              : "no posts yet today — hermes runs at 5am UTC"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalToday > 0 && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={generating}
              title="Regenerate all posts for today"
              className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11.5px] text-[#3F3F3F] hover:bg-[#F6F4EF] disabled:opacity-50"
            >
              <RotateCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
              regenerate
            </button>
          )}
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="flex h-7 items-center gap-1.5 rounded-md border border-[#E7E5E0] bg-white px-2.5 font-mono text-[11.5px] text-[#3F3F3F] hover:bg-[#F6F4EF] disabled:opacity-50"
          >
            <RotateCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 font-mono text-[12px] text-[#737373]">
          <Loader2 className="h-4 w-4 animate-spin" /> loading queue…
        </div>
      ) : totalToday === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1EC]">
            <Zap className="h-5 w-5 text-[#F04E23]" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#171717]">no posts yet today</p>
            <p className="mt-1 text-[13px] text-[#737373]">
              Hermes auto-generates at 5am UTC. Generate now to get your daily queue.
            </p>
          </div>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#171717] px-6 text-[13px] font-medium text-white hover:bg-[#3F3F3F] disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "generating posts…" : "generate now"}
          </button>
          {progress > 0 && (
            <div className="w-full max-w-xs space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E7E5E0]">
                <div className="h-full rounded-full bg-[#F04E23] transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <p className="font-mono text-[11px] text-[#737373]">
                generating anchor → spinning engines → scrubbing AI tells…
              </p>
            </div>
          )}
          {error && <p className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <>
          {/* Platform tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-[#E7E5E0] px-5 py-3">
            <PlatformTabs value={platform} onChange={setPlatform} items={tabs} />
            <div className="hidden font-mono text-[10.5px] text-[#737373] md:flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#15803D]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                {approvedCount} of {totalToday} approved
              </span>
            </div>
          </div>

          {/* Posts */}
          <div className="flex flex-col gap-3 p-5">
            {platformPosts.length === 0 ? (
              <div className="py-8 text-center font-mono text-[12px] text-[#737373]">
                no {platform} posts this {platform === "reddit" ? "week" : "day"}
              </div>
            ) : (
              platformPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onAction={handleAction}
                  actioning={actioningId === post.id}
                />
              ))
            )}
          </div>

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
