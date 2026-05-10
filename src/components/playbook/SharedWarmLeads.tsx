"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Link from "next/link";

type Counts = { twitter_x: number; linkedin: number; reddit: number };

const PLATFORM_LABEL: Record<string, string> = {
  twitter_x: "X",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter_x: "bg-gray-100 text-gray-700",
  linkedin: "bg-blue-50 text-blue-700",
  reddit: "bg-orange-50 text-orange-700",
};

function BlurredLeadCard({ platform, onClick }: { platform: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-gray-100 bg-gray-50 p-4 flex gap-4 relative overflow-hidden group cursor-pointer"
    >
      <div className="flex-1 min-w-0 space-y-1.5 blur-sm select-none pointer-events-none" aria-hidden>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              PLATFORM_COLORS[platform] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {PLATFORM_LABEL[platform] ?? platform}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            🔥 Hot
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100 ml-auto">
            87
          </span>
        </div>
        <div className="h-3.5 w-40 bg-gray-300 rounded-full" />
        <div className="h-3 w-56 bg-gray-200 rounded-full" />
        <div className="h-3 w-48 bg-gray-200 rounded-full" />
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

export function SharedWarmLeads({ shareToken }: { shareToken: string }) {
  const [counts, setCounts] = useState<Counts>({ twitter_x: 0, linkedin: 0, reddit: 0 });
  const [loading, setLoading] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/shared/${shareToken}/leads`);
        const json = await res.json();
        if (res.ok) {
          setCounts(json.counts ?? { twitter_x: 0, linkedin: 0, reddit: 0 });
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [shareToken]);

  const totalLeads = counts.twitter_x + counts.linkedin + counts.reddit;

  // Build blurred placeholders for every lead
  const blurredCards: { platform: string; key: string }[] = [];
  for (const platform of ["twitter_x", "linkedin", "reddit"] as const) {
    const count = Math.min(counts[platform], 4);
    for (let i = 0; i < count; i++) {
      blurredCards.push({ platform, key: `blur-${platform}-${i}` });
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a2e]">Warm Leads</h2>
            <p className="text-sm text-gray-500 mt-1">
              People expressing intent that matches this playbook&apos;s keywords.
            </p>
          </div>
          {totalLeads > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-green-50 border border-green-100 text-sm font-bold text-green-700">
              {totalLeads} total leads
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && totalLeads === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium">No leads captured yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Install the Farcast extension and browse X, LinkedIn, or Reddit to capture leads.
            </p>
          </div>
        )}

        {!loading && blurredCards.length > 0 && (
          <div className="space-y-3">
            {blurredCards.map((item) => (
              <BlurredLeadCard
                key={item.key}
                platform={item.platform}
                onClick={() => setShowSignInModal(true)}
              />
            ))}
          </div>
        )}

        {!loading && totalLeads > 0 && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowSignInModal(true)}
              className="text-sm font-semibold text-[#F25C2C] hover:underline"
            >
              Sign in to see all {totalLeads} leads →
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
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Unlock all leads</h3>
            <p className="text-sm text-gray-500 mb-6">
              Sign in to GetFarcast to view all warm leads, generate personalised DMs, and create your own AI growth playbook.
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
