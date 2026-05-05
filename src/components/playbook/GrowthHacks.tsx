"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Wifi, MapPin, Sparkles, RefreshCw, Clock, Target, ChevronRight } from "lucide-react";
import type { GrowthHack, ICPProfile } from "@/lib/types";

const EFFORT_COLORS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  medium: "bg-amber-50 text-amber-700 border-amber-100",
  high: "bg-red-50 text-red-700 border-red-100",
};

const EFFORT_LABEL: Record<string, string> = {
  low: "Low effort",
  medium: "Medium effort",
  high: "High effort",
};

function HackCard({ hack, index }: { hack: GrowthHack; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e]/10 to-[#ff8c5a]/10 border border-[#ff6b4e]/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#ff6b4e]">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-base font-bold text-[#1a1a2e]">{hack.title}</h3>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${hack.type === "online" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"}`}>
                {hack.type === "online"
                  ? <Wifi className="w-3 h-3" />
                  : <MapPin className="w-3 h-3" />
                }
                {hack.type === "online" ? "Online" : "Offline"}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${EFFORT_COLORS[hack.effort] || EFFORT_COLORS.medium}`}>
                {EFFORT_LABEL[hack.effort] || hack.effort}
              </span>
            </div>

            <p className="text-xs font-semibold text-[#ff6b4e] mb-2">{hack.platform}</p>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">{hack.description}</p>

            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">{hack.timeToFirstUser} to first user</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">{hack.expectedResult}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 ml-14 p-3 rounded-xl bg-gray-50 border border-black/5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Where exactly</p>
          <p className="text-sm text-[#1a1a2e] font-medium leading-relaxed">{hack.where}</p>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 ml-14 flex items-center gap-1.5 text-sm font-semibold text-[#ff6b4e] hover:text-[#e85c3f] transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
          {expanded ? "Hide steps" : "Show action steps"}
        </button>

        {expanded && (
          <div className="mt-3 ml-14 space-y-2">
            {hack.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#ff6b4e]/10 border border-[#ff6b4e]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[#ff6b4e]">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function GrowthHacks({
  playbookId,
  productName,
  productDescription,
  icp,
}: {
  playbookId: string;
  productName: string;
  productDescription: string;
  icp: ICPProfile;
}) {
  const CACHE_KEY = `growth_hacks_${playbookId}`;

  const [hacks, setHacks] = useState<GrowthHack[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setHacks(JSON.parse(cached));
      } catch {
        // ignore bad cache
      }
    }
  }, [CACHE_KEY]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-growth-hacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, productDescription, icp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      const result: GrowthHack[] = data.growthHacks;
      setHacks(result);
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-50 to-transparent rounded-3xl p-6 sm:p-8 border border-orange-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shrink-0 shadow-md shadow-[#ff6b4e]/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#1a1a2e]">Growth Hacks</h2>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed font-medium">
              AI-identified non-obvious places where your ICP hangs out — and exactly how to get them to sign up. These are channels beyond Reddit, LinkedIn, and X.
            </p>
          </div>
          {hacks && (
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-all disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hacks && !loading && (
        <div className="text-center py-16 px-6 space-y-6">
          <div className="w-20 h-20 bg-[#ff6b4e]/5 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-[#ff6b4e]/10">
            <Sparkles className="w-10 h-10 text-[#ff6b4e]" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Find your hidden audience</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Generate 3-4 targeted growth hacks specific to where your ICP actually hangs out — think Upwork, Slack communities, industry events, and more.
            </p>
          </div>
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-[#ff6b4e]/20 transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Generate Growth Hacks
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16 px-6 space-y-4">
          <div className="w-12 h-12 border-4 border-[#ff6b4e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Analyzing where your ICP hangs out...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Hacks list */}
      {hacks && !loading && (
        <div className="space-y-4">
          {hacks.map((hack, i) => (
            <HackCard key={i} hack={hack} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
