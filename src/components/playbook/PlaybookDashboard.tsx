"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Share2,
  Mail,
  Download,
  Share,
  Zap
} from "lucide-react";
import type { Playbook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";
import { PlaybookChannels } from "./PlaybookChannels";
import { PlaybookOutreach } from "./PlaybookOutreach";
import Link from "next/link";

export function PlaybookDashboard({
  playbookId,
}: {
  playbookId: string;
}) {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "icp" | "channels" | "outreach">("overview");

  useEffect(() => {
    async function loadPlaybook() {
      // 1. Try local storage first for instant load
      const raw = localStorage.getItem(`playbook_${playbookId}`);
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          setPlaybook(stored.playbook);
          return;
        } catch (e) {
          console.error("Failed to parse local playbook", e);
        }
      }

      // 2. Fallback to fetching from Supabase Database
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playbooks")
        .select("data")
        .eq("id", playbookId)
        .single();

      if (data && data.data) {
        setPlaybook(data.data as Playbook);
        // Sync it to local storage for speed next time
        localStorage.setItem(
          `playbook_${playbookId}`,
          JSON.stringify({ playbook: data.data as Playbook, formData: {} })
        );
      } else {
        console.error("Playbook not found in DB either", error);
        router.push("/dashboard");
      }
    }

    loadPlaybook();
  }, [playbookId, router]);

  if (!playbook) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff6b4e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Executive Summary", icon: LayoutDashboard },
    { id: "icp", label: "Audience Profiling", icon: Users },
    { id: "channels", label: "Distribution Channels", icon: Share2 },
    { id: "outreach", label: "Outreach & DMs", icon: Mail },
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
              href="/onboarding"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-all"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-gray-400" />
              New Playbook
            </Link>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8">
            {activeTab === "overview" && <PlaybookOverview playbook={playbook} />}
            {activeTab === "icp" && <PlaybookICP icp={playbook.icp} />}
            {activeTab === "channels" && <PlaybookChannels channels={playbook.channels} />}
            {activeTab === "outreach" && <PlaybookOutreach outreach={playbook.outreach} />}
          </div>
        </main>
      </div>
    </div>
  );
}
