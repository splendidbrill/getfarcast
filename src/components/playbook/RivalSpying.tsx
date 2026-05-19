"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Globe,
  AtSign,
  Briefcase,
  Camera,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  Calendar,
  X,
  Search,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RedditBrief {
  trends: string[];
  complaints: string[];
  memes: string[];
  nativeVocabulary: string[];
  contentAngles: string[];
}

interface CounterPost {
  platform: "linkedin" | "twitter_x" | "founder_story";
  label: string;
  content: string;
  angle: string;
}

interface HermesResult {
  id: string | null;
  competitorUrl: string;
  marketingAngle: string;
  topWeaknesses: string[];
  counterPosts: CounterPost[];
  platformsScraped: {
    website: boolean;
    twitter: boolean;
    linkedin: boolean;
    instagram: boolean;
  };
}

interface SavedResult extends HermesResult {
  createdAt?: string;
}

const PLATFORM_COLORS: Record<CounterPost["platform"], string> = {
  linkedin: "bg-blue-50 text-blue-700 border-blue-100",
  twitter_x: "bg-slate-50 text-slate-700 border-slate-200",
  founder_story: "bg-orange-50 text-[#E55A24] border-orange-100",
};

const PLATFORM_ICONS: Record<CounterPost["platform"], React.ReactNode> = {
  linkedin: <Briefcase className="w-3.5 h-3.5" />,
  twitter_x: <AtSign className="w-3.5 h-3.5" />,
  founder_story: <Zap className="w-3.5 h-3.5" />,
};

const STEP_MESSAGES = [
  "Scraping competitor website…",
  "Checking social profiles…",
  "Analysing with Hermes…",
  "Generating counter-posts…",
];

const PLATFORM_TO_QUEUE: Record<CounterPost["platform"], "twitter" | "linkedin"> = {
  twitter_x:     "twitter",
  linkedin:      "linkedin",
  founder_story: "linkedin",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
      >
        <Calendar className="w-3.5 h-3.5" />
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
        className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#E55A24] transition"
      />
      <button
        onClick={handleAdd}
        disabled={!scheduledFor || status === "loading"}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
          status === "done"
            ? "bg-emerald-500 text-white"
            : status === "error"
            ? "bg-red-500 text-white"
            : "bg-[#E55A24] text-white hover:opacity-90 disabled:opacity-50"
        }`}
      >
        {status === "loading" ? "Adding…" : status === "done" ? "✓ Added!" : status === "error" ? "Failed" : "Add to Queue"}
      </button>
      <button onClick={() => { setOpen(false); setStatus("idle"); }} className="p-1 text-gray-400 hover:text-gray-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function PostCard({ post, playbookId }: { post: CounterPost; playbookId: string }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${PLATFORM_COLORS[post.platform]}`}
          >
            {PLATFORM_ICONS[post.platform]}
            {post.label}
          </span>
          {post.angle && (
            <span className="text-xs text-gray-400 italic hidden sm:block">
              "{post.angle}"
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <ScheduleButton content={post.content} platform={PLATFORM_TO_QUEUE[post.platform]} playbookId={playbookId} />
          <CopyButton text={post.content} />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 py-4">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, playbookId }: { result: HermesResult; playbookId: string }) {
  return (
    <div className="space-y-5">
      {/* Intel summary */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Platforms scraped
          </span>
          {(["website", "twitter", "linkedin", "instagram"] as const).map((p) => (
            <span
              key={p}
              className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                result.platformsScraped[p]
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-gray-100 text-gray-400 border-gray-200 line-through"
              }`}
            >
              {p}
            </span>
          ))}
        </div>

        {result.marketingAngle && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Their angle
            </p>
            <p className="text-sm text-slate-700">{result.marketingAngle}</p>
          </div>
        )}

        {result.topWeaknesses.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Exploitable weaknesses
            </p>
            <ul className="space-y-1">
              {result.topWeaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-[#E55A24] font-bold mt-0.5">→</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Counter posts */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Counter-posts generated by Hermes
        </p>
        {result.counterPosts.map((post, i) => (
          <PostCard key={i} post={post} playbookId={playbookId} />
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RivalSpying({
  playbookId,
  productName,
  productDescription,
}: {
  playbookId: string;
  productName?: string;
  productDescription?: string;
}) {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<HermesResult | null>(null);
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);

  // Reddit Recon state
  const [subreddit, setSubreddit] = useState("");
  const [redditRunning, setRedditRunning] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [redditBrief, setRedditBrief] = useState<(RedditBrief & { subreddit: string }) | null>(null);

  // Step message cycling during loading
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEP_MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Load past results for this playbook from local cache
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`hermes_${playbookId}`);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, [playbookId]);

  const persistToHistory = (result: HermesResult) => {
    const entry: SavedResult = { ...result, createdAt: new Date().toISOString() };
    setHistory((prev) => {
      const filtered = prev.filter((r) => r.competitorUrl !== result.competitorUrl);
      const next = [entry, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(`hermes_${playbookId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleRun = async () => {
    if (!competitorUrl.trim()) return;

    setIsRunning(true);
    setError(null);
    setResults(null);
    setStepIndex(0);
    setSelectedHistory(null);

    try {
      const res = await fetch("/api/agent/recon/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbookId,
          competitorUrl: competitorUrl.trim(),
          twitterHandle: twitterHandle.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          instagramHandle: instagramHandle.trim() || undefined,
          productName,
          productDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);

      const result = json as HermesResult;
      setResults(result);
      persistToHistory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsRunning(false);
    }
  };

  const handleRedditRecon = async () => {
    if (!subreddit.trim()) return;
    setRedditRunning(true);
    setRedditError(null);
    setRedditBrief(null);
    try {
      const res = await fetch("/api/agent/recon/reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subreddit: subreddit.trim(), playbookId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setRedditBrief({ ...json.brief, subreddit: json.subreddit });
    } catch (err) {
      setRedditError(err instanceof Error ? err.message : "Reddit recon failed");
    } finally {
      setRedditRunning(false);
    }
  };

  const displayedResult =
    selectedHistory !== null ? history[selectedHistory] : results;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FFF1EA] flex items-center justify-center shrink-0">
          <Eye className="w-4.5 h-4.5 text-[#E55A24]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e]">Rival Spying</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Hermes scrapes your competitor across every platform, finds their weaknesses, and writes
            counter-content for you.
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Competitor intelligence
        </p>

        {/* Website URL (required) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            Competitor website <span className="text-[#E55A24]">*</span>
          </label>
          <input
            type="url"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="https://competitor.com"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-700 placeholder-gray-400 outline-none focus:border-[#E55A24] transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Twitter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-gray-400" />
              X/Twitter handle
            </label>
            <input
              type="text"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="@competitor"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-700 placeholder-gray-400 outline-none focus:border-[#E55A24] transition"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              LinkedIn company URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/company/…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-700 placeholder-gray-400 outline-none focus:border-[#E55A24] transition"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-gray-400" />
              Instagram handle
            </label>
            <input
              type="text"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@competitor"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-700 placeholder-gray-400 outline-none focus:border-[#E55A24] transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleRun}
            disabled={isRunning || !competitorUrl.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F25C2C] to-[#FF7A3D] text-white text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Hermes…
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Run Hermes
              </>
            )}
          </button>
          {isRunning && (
            <p className="text-xs text-gray-400 animate-pulse">{STEP_MESSAGES[stepIndex]}</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* History tabs */}
      {history.length > 0 && !isRunning && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Past analyses</p>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => {
              const active = selectedHistory === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedHistory(active ? null : i);
                    setResults(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all truncate max-w-[200px] ${
                    active
                      ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {new URL(h.competitorUrl).hostname}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {displayedResult && !isRunning && <ResultCard result={displayedResult} playbookId={playbookId} />}

      {/* Loading skeleton */}
      {isRunning && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      )}

      {/* ── Reddit Recon ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-bold text-[#1a1a2e]">Reddit Community Recon</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold border border-orange-100">
            Reddit
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Enter a subreddit your ICP hangs out in. Hermes reads today's top posts and extracts trends, complaints, and content angles native to that community.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">r/</span>
            <input
              type="text"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value.replace(/^r\//, ""))}
              onKeyDown={(e) => e.key === "Enter" && !redditRunning && void handleRedditRecon()}
              placeholder="entrepreneur"
              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-700 placeholder-gray-400 outline-none focus:border-[#E55A24] transition"
            />
          </div>
          <button
            onClick={handleRedditRecon}
            disabled={redditRunning || !subreddit.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {redditRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {redditRunning ? "Running…" : "Run Recon"}
          </button>
        </div>

        {redditError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {redditError}
          </div>
        )}

        {redditBrief && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              r/{redditBrief.subreddit} — Today's Intelligence
            </p>
            {(
              [
                { key: "trends",          label: "Trending Topics",    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                { key: "complaints",      label: "Pain Points",        color: "text-red-700",     bg: "bg-red-50 border-red-100" },
                { key: "nativeVocabulary", label: "Native Language",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-100" },
                { key: "contentAngles",   label: "Content Angles",    color: "text-purple-700",  bg: "bg-purple-50 border-purple-100" },
              ] as const
            ).map(({ key, label, color, bg }) => {
              const items = redditBrief[key] ?? [];
              if (!items.length) return null;
              return (
                <div key={key} className={`rounded-xl border p-3 space-y-1.5 ${bg}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</p>
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <span className={`font-bold mt-0.5 ${color}`}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
