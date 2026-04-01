"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  LayoutDashboard,
  Users,
  Radio,
  Mail,
  ArrowLeft,
  Download,
  Copy,
  Check,
} from "lucide-react";
import type { StoredPlaybook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";
import { PlaybookChannels } from "./PlaybookChannels";
import { PlaybookOutreach } from "./PlaybookOutreach";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "icp", label: "ICP", icon: Users },
  { id: "channels", label: "Channels", icon: Radio },
  { id: "outreach", label: "Outreach", icon: Mail },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PlaybookDashboard({ id }: { id: string }) {
  const router = useRouter();
  const [stored, setStored] = useState<StoredPlaybook | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(`playbook_${id}`);
    if (raw) {
      try {
        setStored(JSON.parse(raw));
      } catch {
        console.error("Failed to parse playbook");
      }
    }
    setLoading(false);
  }, [id]);

  const handleCopyAll = async () => {
    if (!stored) return;
    await navigator.clipboard.writeText(
      JSON.stringify(stored.playbook, null, 2)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!stored) return;
    const blob = new Blob([JSON.stringify(stored.playbook, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stored.playbook.productName.toLowerCase().replace(/\s+/g, "-")}-playbook.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft text-brand-400">
          <Zap className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (!stored) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-white font-semibold">Playbook not found</p>
          <p className="text-sm text-surface-200/50">
            This playbook may have been cleared from your browser.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-medium text-sm hover:scale-105 transition-transform"
          >
            <Zap className="w-4 h-4" />
            Generate a new playbook
          </Link>
        </div>
      </div>
    );
  }

  const { playbook } = stored;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center transition-transform group-hover:scale-110">
                <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white hidden sm:block">
                Get<span className="text-gradient-brand">Farcast</span>
              </span>
            </Link>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">
                {playbook.productName}
              </p>
              <p className="text-xs text-surface-200/40">Growth Playbook</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-200/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-200/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:from-brand-400 hover:to-accent-400 transition-all shadow-lg shadow-brand-500/20"
            >
              <Zap className="w-3.5 h-3.5" />
              New Playbook
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-surface-200/40 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to home
        </Link>

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/5 mb-8 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg"
                    : "text-surface-200/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && <PlaybookOverview playbook={playbook} />}
          {activeTab === "icp" && <PlaybookICP icp={playbook.icp} />}
          {activeTab === "channels" && (
            <PlaybookChannels channels={playbook.channels} />
          )}
          {activeTab === "outreach" && (
            <PlaybookOutreach outreach={playbook.outreach} />
          )}
        </div>
      </div>
    </div>
  );
}
