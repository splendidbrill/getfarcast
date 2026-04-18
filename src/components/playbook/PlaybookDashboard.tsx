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
  Zap,
  Sparkles,
  Target,
  Plus,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Lightbulb,
  Rocket,
  NotebookPen,
} from "lucide-react";
import type { Playbook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";
import { PlaybookChannels } from "./PlaybookChannels";
import { PlaybookOutreach } from "./PlaybookOutreach";
import { WeeklyContentEngine } from "./WeeklyContentEngine";
import { WeeklyContentIdeas } from "./WeeklyContentIdeas";
import { DailyLogs } from "./DailyLogs";
import Link from "next/link";

type MainTab = "overview" | "icp" | "channels" | "logs" | "outreach" | "posts" | "leads";
type ContentSubTab = "weekly-engine" | "weekly-ideas" | "launch-posts";

export function PlaybookDashboard({ playbookId }: { playbookId: string }) {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [contentEngineOpen, setContentEngineOpen] = useState(false);
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>("weekly-engine");

  useEffect(() => {
    async function loadPlaybook() {
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

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("playbooks")
        .select("data")
        .eq("id", playbookId)
        .single();

      if (data && data.data) {
        const parsedPlaybook = data.data.playbook ? data.data.playbook : data.data;
        setPlaybook(parsedPlaybook as Playbook);
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

  const mainTabs = [
    { id: "overview" as const, label: "Executive Summary", icon: LayoutDashboard },
    { id: "icp" as const, label: "Audience Profiling", icon: Users },
    { id: "channels" as const, label: "Distribution Channels", icon: Share2 },
    { id: "logs" as const, label: "Daily Logs", icon: NotebookPen },
    { id: "outreach" as const, label: "Outreach & DMs", icon: Mail },
  ];

  const contentSubTabs = [
    { id: "weekly-engine" as const, label: "Weekly Content Engine", icon: CalendarDays },
    { id: "weekly-ideas" as const, label: "Weekly Content Ideas", icon: Lightbulb },
    { id: "launch-posts" as const, label: "Launch Posts", icon: Rocket },
  ];

  const isContentEngineVisible = contentEngineOpen || activeTab === "posts";

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
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a2e] text-white text-sm font-medium hover:bg-black transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <nav className="w-full md:w-64 shrink-0 space-y-1">
          {/* Regular tabs */}
          {mainTabs.map((t) => {
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
                <Icon className={`w-4 h-4 ${isActive ? "text-[#ff6b4e]" : "text-gray-400"}`} />
                {t.label}
              </button>
            );
          })}

          {/* Content Engine — expandable tree */}
          <div>
            <button
              onClick={() => {
                if (activeTab !== "posts") {
                  setActiveTab("posts");
                  setContentEngineOpen(true);
                } else {
                  setContentEngineOpen((o) => !o);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                activeTab === "posts"
                  ? "bg-white text-[#ff6b4e] shadow-sm border border-black/5"
                  : "text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === "posts" ? "text-[#ff6b4e]" : "text-gray-400"}`} />
              <span className="flex-1 text-left">Content Engine</span>
              {isContentEngineVisible
                ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              }
            </button>

            {isContentEngineVisible && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-black/5 pl-3">
                {contentSubTabs.map((st) => {
                  const SubIcon = st.icon;
                  const isActive = activeTab === "posts" && contentSubTab === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => { setActiveTab("posts"); setContentSubTab(st.id); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white text-[#ff6b4e] shadow-sm border border-black/5"
                          : "text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5"
                      }`}
                    >
                      <SubIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#ff6b4e]" : "text-gray-400"}`} />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warm Leads */}
          <button
            onClick={() => setActiveTab("leads")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
              activeTab === "leads"
                ? "bg-white text-[#ff6b4e] shadow-sm border border-black/5"
                : "text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5"
            }`}
          >
            <Target className={`w-4 h-4 ${activeTab === "leads" ? "text-[#ff6b4e]" : "text-gray-400"}`} />
            Warm Leads
          </button>

          {/* Launch CTA */}
          <div className="mt-4 pt-4 border-t border-black/5">
            <Link
              href={`/playbook/${playbookId}/launch`}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] hover:from-[#e85c3f] hover:to-[#f07a48] shadow-sm hover:shadow-md transition-all"
            >
              <Rocket className="w-4 h-4" />
              Launch your product
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
              All Playbooks
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-[#1a1a2e] hover:bg-black/5 transition-all"
            >
              <Plus className="w-4 h-4 text-gray-400" />
              New Playbook
            </Link>
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8">
            {activeTab === "overview" && <PlaybookOverview playbook={playbook} />}
            {activeTab === "icp" && <PlaybookICP icp={playbook.icp} />}
            {activeTab === "channels" && <PlaybookChannels playbookId={playbook.id} channels={playbook.channels} />}
            {activeTab === "logs" && <DailyLogs />}
            {activeTab === "outreach" && <PlaybookOutreach outreach={playbook.outreach} />}

            {activeTab === "posts" && contentSubTab === "weekly-engine" && (
              <WeeklyContentEngine playbook={playbook} />
            )}
            {activeTab === "posts" && contentSubTab === "weekly-ideas" && (
              <WeeklyContentIdeas playbook={playbook} />
            )}
            {activeTab === "posts" && contentSubTab === "launch-posts" && (
              <div className="text-center py-20 px-6 space-y-6">
                <div className="w-20 h-20 bg-[#ff6b4e]/5 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-[#ff6b4e]/10">
                  <Rocket className="w-10 h-10 text-[#ff6b4e]" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-[#1a1a2e] mb-2">Launch Posts</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    One-time platform-native posts for Product Hunt, Hacker News, Indie Hackers, Dev.to, and more — each written in that platform&apos;s exact native language.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b4e]/5 text-[#ff6b4e] rounded-full text-sm font-bold border border-[#ff6b4e]/20">
                  <Sparkles className="w-4 h-4" />
                  Coming Soon
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div className="text-center py-20 px-6 space-y-6">
                <div className="w-20 h-20 bg-[#ff6b4e]/5 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-[#ff6b4e]/10">
                  <Target className="w-10 h-10 text-[#ff6b4e]" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-[#1a1a2e] mb-2">Your Daily Warm Lead List</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Farcast tracks two signals — people actively expressing the problem your product solves across your channels, and your target customer who engaged with your content. Both land in your inbox every morning, ready to reach out.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold border border-blue-100">
                  <Sparkles className="w-4 h-4" />
                  Launching Soon with our Chrome Extension
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
