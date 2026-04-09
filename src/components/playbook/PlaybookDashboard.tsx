"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Share2,
  Mail,
  Download,
  Share,
  Zap,
} from "lucide-react";
import type { Playbook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";
import { PlaybookChannels } from "./PlaybookChannels";
import { PlaybookOutreach } from "./PlaybookOutreach";
import { PlaybookPosts } from "./PlaybookPosts";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function PlaybookDashboard({
  playbookId,
}: {
  playbookId: string;
}) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "icp" | "channels" | "outreach" | "posts">("overview");

  useEffect(() => {
    async function loadPlaybook() {
      setLoading(true);
      setLoadError("");

      // 1. Try localStorage first (fastest, no network)
      const raw = localStorage.getItem(`playbook_${playbookId}`);
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          setPlaybook(stored.playbook);
          setLoading(false);
          return;
        } catch (e) {
          console.warn("localStorage parse failed, falling back to Supabase");
        }
      }

      // 2. Fallback: load from Supabase
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("playbooks")
          .select("data")
          .eq("id", playbookId)
          .single();

        if (error || !data) {
          console.error("Supabase load failed:", error?.message);
          setLoadError("Could not load this playbook. It may have been deleted.");
          setLoading(false);
          return;
        }

        const pb = data.data?.playbook || data.data;
        const fd = data.data?.formData;

        if (!pb) {
          setLoadError("Playbook data is malformed.");
          setLoading(false);
          return;
        }

        // Cache in localStorage for next time
        localStorage.setItem(`playbook_${playbookId}`, JSON.stringify({ playbook: pb, formData: fd }));
        setPlaybook(pb);
      } catch (err) {
        setLoadError("An unexpected error occurred loading the playbook.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadPlaybook();
  }, [playbookId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-[#ff6b4e] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading your playbook...</p>
      </div>
    );
  }

  if (loadError || !playbook) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center flex-col gap-6 px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">📭</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Playbook not found</h2>
          <p className="text-gray-500 text-sm max-w-sm">{loadError || "This playbook could not be loaded."}</p>
        </div>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-xl bg-[#1a1a2e] text-white text-sm font-bold hover:bg-black transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Executive Summary", icon: LayoutDashboard },
    { id: "icp", label: "Audience Profiling", icon: Users },
    { id: "channels", label: "Distribution Channels", icon: Share2 },
    { id: "outreach", label: "Outreach & DMs", icon: Mail },
    { id: "posts", label: "Content Engine", icon: Zap },
    { id: "Warm Leads", label: "Warm Leads", icon: Zap },
  ] as const;

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1a2e]">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 78, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 78, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed top-0 inset-x-0 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,200,170,0.3) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#1a1a2e] hidden sm:block">
                Get<span className="text-[#ff6b4e]">Farcast</span>
              </span>
            </Link>
            <div className="h-6 w-px bg-black/10 hidden sm:block" />
            <h1 className="text-sm font-semibold text-[#1a1a2e]">
              {playbook.productName} Playbook
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-colors">
              <Share className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-medium hover:bg-black transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white text-[#ff6b4e] shadow-sm border border-black/5"
                    : "text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-[#ff6b4e]" : "text-gray-400"}`} />
                {t.label}
              </button>
            );
          })}

          <div className="mt-8 pt-8 border-t border-black/5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-all"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-gray-400" />
              All Playbooks
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-all"
            >
              <Zap className="w-4.5 h-4.5 text-gray-400" />
              New Playbook
            </Link>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8">
            {activeTab === "overview" && <PlaybookOverview playbook={playbook} />}
            {activeTab === "icp" && <PlaybookICP icp={playbook.icp} />}
            {activeTab === "channels" && <PlaybookChannels playbookId={playbookId} channels={playbook.channels} />}
            {activeTab === "outreach" && <PlaybookOutreach outreach={playbook.outreach} />}
            {activeTab === "posts" && (
              playbook.postsCalendar
                ? <PlaybookPosts postsCalendar={playbook.postsCalendar} />
                : (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-sm font-medium">Post calendar not available for this playbook.</p>
                    <p className="text-xs mt-1">Regenerate your playbook to get the post calendar.</p>
                  </div>
                )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
