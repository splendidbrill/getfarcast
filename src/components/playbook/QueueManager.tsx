"use client";

import { useState, useCallback } from "react";
import { Clock, Trash2, RefreshCw, CalendarDays, CheckCircle, XCircle, Send, FileText } from "lucide-react";

type QueueItem = {
  id: string;
  content: string;
  platform: "twitter" | "linkedin";
  scheduled_for: string;
  status: "draft" | "ready" | "deployed" | "skipped";
  playbook_id: string | null;
  source: string | null;
  created_at: string;
};

type StatusFilter = "all" | "ready" | "draft" | "deployed" | "skipped";

const STATUS_META: Record<QueueItem["status"], { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  ready:    { label: "Ready",    color: "bg-emerald-50 text-emerald-700 border-emerald-100", Icon: Send },
  draft:    { label: "Draft",    color: "bg-gray-100 text-gray-600 border-gray-200",         Icon: FileText },
  deployed: { label: "Deployed", color: "bg-blue-50 text-blue-700 border-blue-100",           Icon: CheckCircle },
  skipped:  { label: "Skipped",  color: "bg-red-50 text-red-600 border-red-100",             Icon: XCircle },
};

const PLATFORM_META: Record<QueueItem["platform"], { label: string; color: string }> = {
  linkedin: { label: "LinkedIn", color: "bg-blue-50 text-blue-700" },
  twitter:  { label: "X / Twitter", color: "bg-slate-100 text-slate-700" },
};

function formatScheduledFor(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function QueueManager({ playbookId }: { playbookId: string }) {
  const [posts, setPosts] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agent/queue?status=all&playbookId=${playbookId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setPosts(json.posts ?? []);
      setHasFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [playbookId]);

  // Lazy-fetch on first render via useEffect equivalent
  if (!hasFetched && !loading) {
    void fetchPosts();
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/agent/queue", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail — post stays in list
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const counts = {
    all: posts.length,
    ready: posts.filter((p) => p.status === "ready").length,
    draft: posts.filter((p) => p.status === "draft").length,
    deployed: posts.filter((p) => p.status === "deployed").length,
    skipped: posts.filter((p) => p.status === "skipped").length,
  };

  const tabs: { id: StatusFilter; label: string }[] = [
    { id: "all",      label: `All (${counts.all})` },
    { id: "ready",    label: `Ready (${counts.ready})` },
    { id: "draft",    label: `Draft (${counts.draft})` },
    { id: "deployed", label: `Deployed (${counts.deployed})` },
    { id: "skipped",  label: `Skipped (${counts.skipped})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF1EA] flex items-center justify-center shrink-0">
            <CalendarDays className="w-4.5 h-4.5 text-[#E55A24]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a2e]">Post Queue</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Posts scheduled via Hermes or content engine. Deploy them via the browser extension.
            </p>
          </div>
        </div>
        <button
          onClick={fetchPosts}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Extension reminder */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-[#FFF8F5] border border-[#FFD5C2] text-sm text-[#B34A1A]">
        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          The extension checks every minute and shows the Deploy button when a post is due.
          Open X.com or LinkedIn first, then click Deploy in the popup.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === id ? "bg-white text-[#1a1a2e] shadow-sm" : "text-gray-500 hover:text-[#1a1a2e]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && hasFetched && filtered.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-gray-400 font-medium text-sm">
            {filter === "all" ? "No posts in the queue yet." : `No ${filter} posts.`}
          </p>
          {filter === "all" && (
            <p className="text-xs text-gray-400">
              Schedule posts using the Schedule button in Rival Spying or the Content Engine.
            </p>
          )}
        </div>
      )}

      {/* Post list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((post) => {
            const statusMeta = STATUS_META[post.status];
            const platformMeta = PLATFORM_META[post.platform] ?? { label: post.platform, color: "bg-gray-100 text-gray-600" };
            const StatusIcon = statusMeta.Icon;
            return (
              <div key={post.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${platformMeta.color}`}>
                      {platformMeta.label}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${statusMeta.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusMeta.label}
                    </span>
                    {post.source && post.source !== "manual" && (
                      <span className="text-xs text-gray-400 font-medium">via {post.source}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatScheduledFor(post.scheduled_for)}
                    </span>
                    {post.status !== "deployed" && (
                      <button
                        onClick={() => void handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content preview */}
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
