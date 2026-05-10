"use client";

import { useEffect, useState } from "react";
import { Lock, TrendingUp, Clock, Target, Wifi, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { GrowthHack } from "@/lib/types";

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
    <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e]/10 to-[#ff8c5a]/10 border border-[#ff6b4e]/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#ff6b4e]">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-base font-bold text-[#1a1a2e]">{hack.title}</h3>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  hack.type === "online"
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-purple-50 text-purple-700 border-purple-100"
                }`}
              >
                {hack.type === "online" ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {hack.type === "online" ? "Online" : "Offline"}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  EFFORT_COLORS[hack.effort] ?? EFFORT_COLORS.medium
                }`}
              >
                {EFFORT_LABEL[hack.effort] ?? hack.effort}
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

function BlurredHackCard({ index, onClick }: { index: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-black/5 bg-white shadow-sm p-6 relative overflow-hidden group cursor-pointer"
    >
      <div className="flex items-start gap-4 blur-sm select-none pointer-events-none" aria-hidden>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e]/10 to-[#ff8c5a]/10 border border-[#ff6b4e]/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-[#ff6b4e]">{index + 1}</span>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-gray-200 rounded-full" />
          <div className="h-3 w-1/3 bg-gray-100 rounded-full" />
          <div className="h-3 w-full bg-gray-100 rounded-full" />
          <div className="h-3 w-5/6 bg-gray-100 rounded-full" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] group-hover:bg-white/80 transition-all">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-[#1a1a2e] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-bold text-[#1a1a2e]">Sign in to view</span>
        </div>
      </div>
    </button>
  );
}

export function SharedGrowthHacks({ shareToken }: { shareToken: string }) {
  const [hacks, setHacks] = useState<GrowthHack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/shared/${shareToken}/growth-hacks`);
        const json = await res.json();
        if (res.ok && Array.isArray(json.growthHacks)) {
          setHacks(json.growthHacks);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [shareToken]);

  const [visible, ...rest] = hacks;

  return (
    <>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-orange-50 to-transparent rounded-3xl p-6 border border-orange-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shrink-0 shadow-md shadow-[#ff6b4e]/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1a1a2e]">Growth Hacks</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed font-medium">
                AI-identified non-obvious places where your ICP hangs out — and exactly how to get them to sign up.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
            <p className="text-center text-xs text-gray-400 font-medium animate-pulse">
              Generating growth hacks…
            </p>
          </div>
        )}

        {!loading && hacks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">No growth hacks available.</p>
          </div>
        )}

        {!loading && hacks.length > 0 && (
          <div className="space-y-4">
            {visible && <HackCard hack={visible} index={0} />}
            {rest.map((_, i) => (
              <BlurredHackCard
                key={i}
                index={i + 1}
                onClick={() => setShowSignInModal(true)}
              />
            ))}
          </div>
        )}

        {!loading && rest.length > 0 && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowSignInModal(true)}
              className="text-sm font-semibold text-[#F25C2C] hover:underline"
            >
              Sign in to unlock {rest.length} more growth hacks →
            </button>
          </div>
        )}
      </div>

      {showSignInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSignInModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A3D] to-[#F25C2C] flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Unlock all growth hacks</h3>
            <p className="text-sm text-gray-500 mb-6">
              Sign in to GetFarcast to see all growth hacks, get step-by-step instructions, and create your own AI growth playbook.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#F25C2C] to-[#FF7A3D] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all"
            >
              Sign in with Google
            </Link>
            <button
              onClick={() => setShowSignInModal(false)}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
