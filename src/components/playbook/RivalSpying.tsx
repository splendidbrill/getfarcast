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
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function PostCard({ post }: { post: CounterPost }) {
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
        <div className="flex items-center gap-2">
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

function ResultCard({ result }: { result: HermesResult }) {
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
          <PostCard key={i} post={post} />
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
      {displayedResult && !isRunning && <ResultCard result={displayedResult} />}

      {/* Loading skeleton */}
      {isRunning && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
          <div className="h-40 rounded-2xl bg-gray-100" />
        </div>
      )}
    </div>
  );
}
