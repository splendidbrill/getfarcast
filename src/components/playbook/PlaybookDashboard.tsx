"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Share2, Download, BookOpen, Zap, Sparkles,
  Target, Plus, ChevronRight, ChevronDown, CalendarDays, Lightbulb,
  Rocket, NotebookPen, TrendingUp, CheckSquare, ArrowLeft, Link2, Check,
} from "lucide-react";
import type { Playbook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";
import { PlaybookChannels } from "./PlaybookChannels";
import { WeeklyContentEngine } from "./WeeklyContentEngine";
import { WeeklyContentIdeas } from "./WeeklyContentIdeas";
import { DailyLogs } from "./DailyLogs";
import { PlaybookPrintView } from "./PlaybookPrintView";
import { WarmLeads } from "./WarmLeads";
import { GrowthHacks } from "./GrowthHacks";
import { DailyTodo } from "./DailyTodo";
import Link from "next/link";

type MainTab = "todo" | "overview" | "icp" | "channels" | "logs" | "posts" | "leads" | "growth-hacks";
type ContentSubTab = "weekly-engine" | "weekly-ideas";

// ── Collapsible Sidebar ───────────────────────────────────────────────────────

function Sidebar({
  activeTab,
  setActiveTab,
  contentEngineOpen,
  setContentEngineOpen,
  contentSubTab,
  setContentSubTab,
  playbookId,
  playbookName,
}: {
  activeTab: MainTab;
  setActiveTab: (t: MainTab) => void;
  contentEngineOpen: boolean;
  setContentEngineOpen: (v: boolean) => void;
  contentSubTab: ContentSubTab;
  setContentSubTab: (t: ContentSubTab) => void;
  playbookId: string;
  playbookName: string;
}) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { id: "todo" as MainTab,         label: "Daily To-Do",            Icon: CheckSquare },
    { id: "overview" as MainTab,     label: "Executive Summary",       Icon: LayoutDashboard },
    { id: "icp" as MainTab,          label: "Audience Profiling",      Icon: Users },
    { id: "channels" as MainTab,     label: "Distribution Channels",   Icon: Share2 },
    { id: "leads" as MainTab,        label: "Warm Leads",              Icon: Target },
    { id: "growth-hacks" as MainTab, label: "Growth Hacks",            Icon: TrendingUp },
    { id: "logs" as MainTab,         label: "Daily Logs",              Icon: NotebookPen },
  ];

  const contentSubTabs = [
    { id: "weekly-engine" as ContentSubTab, label: "Weekly Content Engine", Icon: CalendarDays },
    { id: "weekly-ideas" as ContentSubTab,  label: "Weekly Content Ideas",  Icon: Lightbulb },
  ];

  const isContentActive = activeTab === "posts";

  return (
    <aside
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-white border-r border-[#E2E8F0] transition-[width] duration-200 ease-out overflow-hidden"
      style={{ width: open ? 220 : 64 }}
    >
      {/* Product name strip */}
      <div className="h-11 flex items-center px-4 border-b border-[#E2E8F0] shrink-0 gap-3">
        <div className="w-5 h-5 rounded bg-[#FFF1EA] flex items-center justify-center shrink-0">
          <Zap className="w-3 h-3 text-[#E55A24]" />
        </div>
        <span className={`text-[12px] font-semibold text-slate-700 whitespace-nowrap transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>
          {playbookName}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] transition-colors w-full
                ${isActive ? "bg-[#FFF1EA] text-[#E55A24]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#E55A24]" : "text-slate-400"}`} />
              <span className={`whitespace-nowrap transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>{label}</span>
              {isActive && open && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F25C2C]" />}
            </button>
          );
        })}

        {/* Content Engine — expandable */}
        <div>
          <button
            onClick={() => {
              if (!isContentActive) { setActiveTab("posts"); setContentEngineOpen(true); }
              else setContentEngineOpen(!contentEngineOpen);
            }}
            className={`flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] transition-colors w-full
              ${isContentActive ? "bg-[#FFF1EA] text-[#E55A24]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Sparkles className={`w-[18px] h-[18px] shrink-0 ${isContentActive ? "text-[#E55A24]" : "text-slate-400"}`} />
            <span className={`flex-1 text-left whitespace-nowrap transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>Content Engine</span>
            {open && (contentEngineOpen && isContentActive
              ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            )}
          </button>

          {open && (contentEngineOpen || isContentActive) && (
            <div className="ml-4 mt-0.5 border-l border-[#E2E8F0] pl-3 space-y-0.5">
              {contentSubTabs.map(({ id, label, Icon }) => {
                const isActive = isContentActive && contentSubTab === id;
                return (
                  <button key={id} onClick={() => { setActiveTab("posts"); setContentSubTab(id); }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all w-full
                      ${isActive ? "bg-white text-[#E55A24] shadow-sm border border-black/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#E55A24]" : "text-slate-400"}`} />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-[#E2E8F0] space-y-0.5">
        {/* <Link href={`/playbook/${playbookId}/launch`}
          className="flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] text-white bg-gradient-to-r from-[#F25C2C] to-[#FF7A3D] hover:from-[#E0501F] hover:to-[#F26A24] transition-colors w-full">
          <Rocket className="w-[18px] h-[18px] shrink-0" />
          <span className={`whitespace-nowrap transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>Launch product</span>
        </Link> */}
        <Link href="/dashboard"
          className="flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors w-full">
          <ArrowLeft className="w-[18px] h-[18px] shrink-0 text-slate-400" />
          <span className={`whitespace-nowrap transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>All Playbooks</span>
        </Link>
        <Link href="/onboarding"
          className="flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors w-full">
          <Plus className="w-[18px] h-[18px] shrink-0 text-slate-400" />
          <span className={`whitespace-nowrap transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>New Playbook</span>
        </Link>
      </div>
    </aside>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function PlaybookDashboard({ playbookId }: { playbookId: string }) {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>("todo");
  const [contentEngineOpen, setContentEngineOpen] = useState(false);
  const [contentSubTab, setContentSubTab] = useState<ContentSubTab>("weekly-engine");
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/playbooks/${playbookId}/share`, { method: "POST" });
      const json = await res.json();
      if (json.shareUrl) {
        await navigator.clipboard.writeText(json.shareUrl);
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 3000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    async function load() {
      const raw = localStorage.getItem(`playbook_${playbookId}`);
      if (raw) {
        try {
          const stored = JSON.parse(raw);
          const candidate = stored.playbook ?? stored;
          setPlaybook(candidate.playbook ?? candidate);
          return;
        } catch {}
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.from("playbooks").select("data").eq("id", playbookId).single();
      if (data?.data) {
        const raw2 = data.data as any;
        const p = raw2.playbook ?? raw2;
        setPlaybook(p as Playbook);
        localStorage.setItem(`playbook_${playbookId}`, JSON.stringify({ playbook: p, formData: {} }));
      } else {
        router.push("/dashboard");
      }
    }
    load();
  }, [playbookId, router]);

  useEffect(() => {
    if (!isExportingAll) return;
    const handleAfterPrint = () => { document.body.classList.remove("print-all-mode"); setIsExportingAll(false); };
    window.addEventListener("afterprint", handleAfterPrint);
    const t = window.setTimeout(() => { document.body.classList.add("print-all-mode"); window.print(); }, 350);
    return () => { window.clearTimeout(t); window.removeEventListener("afterprint", handleAfterPrint); document.body.classList.remove("print-all-mode"); };
  }, [isExportingAll]);

  if (!playbook) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F25C2C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#FAFAF7] text-slate-900 print-normal-root">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#E2E8F0] bg-white flex items-center">
          <div className="flex items-center h-full px-6 gap-4 border-r border-[#E2E8F0] w-16 shrink-0 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7A3D] to-[#F25C2C] flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-center justify-between flex-1 px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-[15px] font-semibold tracking-tight text-slate-900 hidden sm:block">
                Get<span className="text-[#F25C2C]">Farcast</span>
              </Link>
              <span className="text-slate-300 hidden sm:block">/</span>
              <span className="text-[13px] text-slate-500">{playbook.productName} Playbook</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {shareLinkCopied ? (
                  <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">Link copied!</span></>
                ) : (
                  <><Link2 className="w-3.5 h-3.5" />Share</>
                )}
              </button>
              <a
                href="https://chromewebstore.google.com/detail/farcast/ljapoonogaahmkkmgbhgielehljmjooa?utm_source=item-share-cb"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F25C2C] to-[#FF7A3D] text-white text-[12.5px] font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                Download Extension
              </a>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-[12.5px] font-medium hover:bg-slate-800 transition-colors">
                <Download className="w-3.5 h-3.5" />Export PDF
              </button>
              <button onClick={() => setIsExportingAll(true)} disabled={isExportingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F25C2C] text-white text-[12.5px] font-medium hover:bg-[#E0501F] transition-colors disabled:opacity-70">
                <BookOpen className="w-3.5 h-3.5" />{isExportingAll ? "Preparing…" : "Export Playbook"}
              </button>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          contentEngineOpen={contentEngineOpen}
          setContentEngineOpen={setContentEngineOpen}
          contentSubTab={contentSubTab}
          setContentSubTab={setContentSubTab}
          playbookId={playbookId}
          playbookName={playbook.productName}
        />

        {/* Main content — offset by header (pt-16) and collapsed sidebar (pl-16) */}
        <main className="pt-16 pl-16">
          <div className="max-w-[1480px] mx-auto px-8 py-8">
            {activeTab === "todo" && <DailyTodo playbook={playbook} playbookId={playbookId} />}

            {(activeTab !== "todo") && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 sm:p-8">
                {activeTab === "overview" && <PlaybookOverview playbook={playbook} />}
                {activeTab === "icp" && <PlaybookICP icp={playbook.icp} />}
                {activeTab === "channels" && <PlaybookChannels playbookId={playbook.id} channels={playbook.channels} />}
                {activeTab === "logs" && <DailyLogs />}

                {activeTab === "posts" && contentSubTab === "weekly-engine" && <WeeklyContentEngine playbook={playbook} />}
                {activeTab === "posts" && contentSubTab === "weekly-ideas" && <WeeklyContentIdeas playbook={playbook} />}

                {activeTab === "leads" && (
                  <WarmLeads playbookId={playbookId} productName={playbook.productName} productDescription={playbook.summary} icp={playbook.icp} />
                )}
                {activeTab === "growth-hacks" && (
                  <GrowthHacks playbookId={playbookId} productName={playbook.productName} productDescription={playbook.summary} icp={playbook.icp} />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {isExportingAll && <PlaybookPrintView playbook={playbook} />}
    </>
  );
}
