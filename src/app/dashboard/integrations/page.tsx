"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

const POSTIZ_URL = process.env.NEXT_PUBLIC_POSTIZ_URL ?? "https://postiz.yourdomain.com";

const XIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l16 16M20 4L4 20" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 13v4" />
  </svg>
);

const ExtIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4h6v6" /><path d="M10 14L20 4" />
    <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
  </svg>
);

export default function IntegrationsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/"; return; }
      setAuthed(true);
    });
  }, []);

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-14">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-[0.14em] font-mono text-[#E55A24]">integrations</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 lowercase leading-tight">
            social connections
          </h1>
          <p className="text-[14px] text-slate-500 mt-1.5 max-w-lg">
            Connect your X and LinkedIn accounts via Postiz to enable one-click scheduled posting from the Daily To-Do tab.
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-white border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-[#E2E8F0] bg-gradient-to-br from-[#FFF6EE] via-[#FFFBF7] to-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-700 shadow-sm">
                  <XIcon />
                </div>
                <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0A66C2] shadow-sm">
                  <LinkedInIcon />
                </div>
              </div>
              <div>
                <div className="text-[14px] font-semibold text-slate-900">Manage Social Connections</div>
                <div className="text-[12px] text-slate-500">X (Twitter) · LinkedIn</div>
              </div>
            </div>
            <p className="text-[13px] text-slate-600 leading-[1.55] max-w-lg">
              OAuth connections are managed securely through our Postiz instance. Connect your accounts there,
              then return here to schedule posts directly from your daily drafts.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-[#FBFAF7] border border-[#E2E8F0] p-4 space-y-2">
              <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-slate-400">how it works</div>
              <ol className="space-y-2">
                {[
                  "Click the button below to open the Postiz connection dashboard.",
                  "Connect your X and/or LinkedIn account via OAuth.",
                  "Return to Farcast — your accounts are ready for scheduled posting.",
                  "Use the \"auto post\" buttons on the Daily To-Do tab to queue posts.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-mono flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[12.5px] leading-[1.55] text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <a
              href={POSTIZ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-slate-900 text-white text-[13.5px] font-medium
                hover:bg-slate-800 transition-colors shadow-[0_2px_8px_-2px_rgba(15,23,42,0.3)]"
            >
              Open Postiz Dashboard
              <ExtIcon />
            </a>

            <p className="text-[11.5px] text-slate-400 leading-relaxed">
              Coming soon: Farcast will display your connected accounts directly on this page
              using the Postiz <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">GET /public/v1/integrations</code> API.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
