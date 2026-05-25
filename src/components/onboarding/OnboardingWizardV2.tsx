"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Loader2,
  Zap,
  Megaphone,
  Send,
  Globe,
  Sparkles,
  Link2,
  AtSign,
  Eye,
  Puzzle,
  ThumbsUp,
  Users,
  ShieldCheck,
  LayoutGrid,
  MessageSquare,
  BarChart3,
  Bot,
  Search,
} from "lucide-react";
import type { WizardFormData, StoredPlaybook } from "@/lib/types";

const ACCENT = "#FF5A4D";
const INK = "#1C1917";

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "product", label: "Product" },
  { key: "rivals", label: "Rivals" },
  { key: "extension", label: "Extension" },
];

interface ProductState {
  url: string;
  scanStatus: "idle" | "scanning" | "done";
  does: string;
  problem: string;
  who: string;
}

interface PipelineStep {
  step: number;
  total: number;
  label: string;
  status: "waiting" | "running" | "done" | "partial";
  substep?: string;
  preview?: string;
}

const INITIAL_PIPELINE: PipelineStep[] = [
  { step: 1, total: 4, label: "Profiling your ideal customer...", status: "waiting" },
  { step: 2, total: 4, label: "Matching distribution channels...", status: "waiting" },
  { step: 3, total: 4, label: "Crafting channel strategies (expert rules applied)...", status: "waiting" },
  { step: 4, total: 4, label: "Sizing the market...", status: "waiting" },
];

function extractProductName(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace("www.", "");
    const raw = host.split(".")[0];
    const stripped = raw.replace(/^(get|try|use|my|app|hello)/i, "") || raw;
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  } catch {
    return url.split(".")[0] || "My Product";
  }
}

// ─── Segmented progress bar ───────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex w-full items-center gap-1.5">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.key} className="flex-1">
            <div className="h-[3px] w-full rounded-full overflow-hidden bg-stone-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: done ? "100%" : active ? "40%" : "0%",
                  backgroundColor: ACCENT,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div
                className="font-mono text-[10.5px] tracking-[0.04em]"
                style={{ color: active || done ? INK : "#a8a29e" }}
              >
                0{i + 1}
              </div>
              <div
                className="text-[11px] font-medium"
                style={{ color: active ? INK : done ? "#78716c" : "#a8a29e" }}
              >
                {s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Eyebrow ──────────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.04em] text-stone-500">
      {children}
    </div>
  );
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────
function Backdrop() {
  const navItems = [
    { icon: LayoutGrid, label: "Operator" },
    { icon: Megaphone, label: "Playbooks" },
    { icon: MessageSquare, label: "Content" },
    { icon: Send, label: "Outreach" },
    { icon: Search, label: "Rivals" },
    { icon: BarChart3, label: "Signals" },
    { icon: Bot, label: "Agents" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(255,90,77,0.06), transparent 60%), " +
            "radial-gradient(900px 500px at 110% 110%, rgba(28,25,23,0.04), transparent 60%)",
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(28,25,23,0.06) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Faux sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-[220px] border-r border-stone-200/70 bg-white/40 backdrop-blur-sm hidden md:block">
        <div className="px-4 py-5 flex items-center gap-2">
          <div
            className="grid h-6 w-6 place-items-center rounded-md text-white text-[12px] font-bold"
            style={{ background: ACCENT }}
          >
            F
          </div>
          <div className="text-[13px] font-semibold" style={{ color: INK }}>
            Farcast
          </div>
        </div>
        <div className="px-2 mt-2 space-y-0.5">
          {navItems.map((n, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px]"
              style={{
                backgroundColor: i === 0 ? "#f5f5f4" : "transparent",
                color: i === 0 ? INK : "#78716c",
              }}
            >
              <n.icon size={14} strokeWidth={1.75} />
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Faux topbar */}
      <div className="absolute left-[220px] right-0 top-0 h-12 border-b border-stone-200/70 bg-white/40 backdrop-blur-sm hidden md:flex items-center justify-between px-5">
        <div className="font-mono text-[11px] tracking-wider uppercase text-stone-500">
          Operator · dashboard
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-stone-200 bg-white px-2.5 py-1 font-mono text-[10.5px] text-stone-500">
            / to search
          </div>
          <div className="h-7 w-7 rounded-full bg-stone-200" />
        </div>
      </div>
      {/* Faux metric cards */}
      <div className="absolute left-[244px] right-6 top-16 hidden md:grid grid-cols-3 gap-3 opacity-90">
        {["Reach (7d)", "Reply rate", "Pipeline"].map((t, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200/70 bg-white/60 p-3 backdrop-blur-sm"
          >
            <div className="text-[11px] text-stone-500">{t}</div>
            <div
              className="mt-2 text-[20px] font-semibold"
              style={{ color: INK, letterSpacing: "-0.022em" }}
            >
              {["38.4k", "12.3%", "$24,810"][i]}
            </div>
            <div className="mt-3 h-10 rounded-md bg-gradient-to-tr from-stone-50 to-stone-100" />
          </div>
        ))}
      </div>
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-[#FFFCF8]/45" />
    </div>
  );
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────
function StepWelcome() {
  const pillars = [
    {
      icon: Zap,
      title: "Growth playbooks",
      sub: "Automated rituals tuned to your stack",
    },
    {
      icon: Megaphone,
      title: "Social content",
      sub: "On-brand posts written from your voice",
    },
    {
      icon: Send,
      title: "Warm outreach",
      sub: "Replies & DMs that don't feel like AI",
    },
  ];

  return (
    <div
      className="flex flex-col items-center px-2 py-10 sm:py-14 text-center"
      style={{ animation: "stepIn .28s ease-out both" }}
    >
      <Eyebrow>01 — Welcome to Farcast</Eyebrow>
      <h1
        className="mt-5 text-[40px] sm:text-[48px] font-semibold leading-[1.02] max-w-[18ch]"
        style={{ color: INK, letterSpacing: "-0.03em" }}
      >
        Let&apos;s build your growth engine.
      </h1>
      <p className="mt-5 max-w-[52ch] text-[15.5px] leading-[1.55] text-stone-600">
        Building is easy. Distribution isn&apos;t. Farcast automates your growth
        playbooks, social content, and warm outreach. Let&apos;s set up your
        agent in{" "}
        <span className="font-medium" style={{ color: INK }}>
          60 seconds
        </span>
        .
      </p>
      <div className="mt-10 grid w-full max-w-[520px] grid-cols-3 gap-3">
        {pillars.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200 bg-white p-3 text-left"
          >
            <p.icon size={16} strokeWidth={1.75} style={{ color: ACCENT }} />
            <div
              className="mt-2 text-[12.5px] font-semibold leading-tight"
              style={{ color: INK }}
            >
              {p.title}
            </div>
            <div className="mt-1 text-[11px] leading-[1.35] text-stone-500">
              {p.sub}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/60 px-3 py-1.5">
        <span className="font-mono text-[10.5px] tracking-wider text-stone-500">
          ETA
        </span>
        <span className="h-3 w-px bg-stone-200" />
        <span className="text-[11.5px] text-stone-600">~60 seconds · 4 steps</span>
      </div>
    </div>
  );
}

// ─── Step 1: Product ──────────────────────────────────────────────────────────
function StepProduct({
  state,
  setState,
}: {
  state: ProductState;
  setState: React.Dispatch<React.SetStateAction<ProductState>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { url, scanStatus, does, problem, who } = state;

  const runAutoFill = () => {
    if (!url || scanStatus === "scanning") return;
    setState((s) => ({ ...s, scanStatus: "scanning" }));
    setTimeout(() => {
      setState((s) => ({ ...s, scanStatus: "done" }));
    }, 1800);
  };

  const fields: {
    key: "does" | "problem" | "who";
    label: string;
    helper: string;
    value: string;
    placeholder: string;
  }[] = [
    {
      key: "does",
      label: "What does it do?",
      helper:
        "Describe your product in 2–3 sentences. What is it? What does it help people do?",
      value: does,
      placeholder: "A scheduling app that turns voice memos into calendar events…",
    },
    {
      key: "problem",
      label: "What problem does it solve?",
      helper:
        "What pain point or frustration does your product solve? Be specific.",
      value: problem,
      placeholder: "Founders waste 30+ minutes a day rescheduling meetings…",
    },
    {
      key: "who",
      label: "Who do you think uses this?",
      helper:
        "e.g. Solo founders who just built their first SaaS and don't know how to get their first users.",
      value: who,
      placeholder: "Indie founders who ship fast but hate calendar admin…",
    },
  ];

  return (
    <div
      className="px-1 py-6 sm:px-2 sm:py-8"
      style={{ animation: "stepIn .28s ease-out both" }}
    >
      <Eyebrow>02 — Auto-extract</Eyebrow>
      <h2
        className="mt-2 text-[26px] sm:text-[28px] font-semibold leading-tight"
        style={{ color: INK, letterSpacing: "-0.022em" }}
      >
        Point us at your product.
      </h2>
      <p className="mt-1.5 text-[14px] text-stone-600 max-w-[58ch]">
        Drop a URL and we&apos;ll pull the positioning, pain points, and audience
        from your site. Edit anything that&apos;s off.
      </p>

      {/* URL row */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12.5px] font-semibold" style={{ color: INK }}>
            Product URL
          </label>
          <span className="font-mono text-[10.5px] tracking-wider text-stone-400">
            REQUIRED
          </span>
        </div>
        <div className="relative flex items-stretch gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <Globe size={15} strokeWidth={1.75} />
            </span>
            {scanStatus === "scanning" && (
              <div
                className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,90,77,0.08), transparent)",
                  animation: "scanSweep 1.6s ease-in-out infinite",
                }}
              />
            )}
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  url: e.target.value,
                  scanStatus: "idle",
                }))
              }
              placeholder="https://yourstartup.com"
              className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-2.5 text-[14px] placeholder:text-stone-400 transition-all focus:outline-none"
              style={{ color: INK }}
              onFocus={(e) => {
                e.target.style.boxShadow = `0 0 0 3px rgba(255,90,77,0.18)`;
                e.target.style.borderColor = ACCENT;
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = "";
                e.target.style.borderColor = "";
              }}
            />
          </div>
          <button
            onClick={runAutoFill}
            disabled={!url || scanStatus === "scanning"}
            className="inline-flex items-center gap-2 rounded-lg px-4 text-[13.5px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            style={{ backgroundColor: INK }}
          >
            {scanStatus === "scanning" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Analyzing</span>
              </>
            ) : scanStatus === "done" ? (
              <>
                <Check size={14} />
                <span>Re-scan</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Auto-Fill</span>
              </>
            )}
          </button>
        </div>
        {/* Status line */}
        <div className="mt-2 h-5 text-[12px] font-mono text-stone-500">
          {scanStatus === "idle" && (
            <span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300 mr-2 align-middle" />
              Awaiting URL…
            </span>
          )}
          {scanStatus === "scanning" && (
            <span style={{ color: ACCENT }}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                style={{
                  background: ACCENT,
                  animation: "pulseDot 1.4s ease-in-out infinite",
                }}
              />
              scanning {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
          )}
          {scanStatus === "done" && (
            <span style={{ color: INK }}>
              <Check
                size={12}
                className="inline -mt-0.5 mr-1.5"
                style={{ color: ACCENT }}
              />
              Scan complete — review and edit the fields below.
            </span>
          )}
        </div>
      </div>

      {/* Textareas */}
      <div className="mt-6 space-y-5">
        {fields.map((f, idx) => (
          <div key={f.key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <label
                className="text-[12.5px] font-semibold"
                style={{ color: INK }}
              >
                <span className="font-mono text-stone-400 mr-2 text-[11px]">
                  0{idx + 1}
                </span>
                {f.label}
              </label>
              {scanStatus === "done" && f.value && (
                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] tracking-wide text-stone-400">
                  <Sparkles size={10} style={{ color: ACCENT }} />
                  auto-filled
                </span>
              )}
            </div>
            <p className="text-[12px] text-stone-500 mb-2 leading-snug">
              {f.helper}
            </p>
            <div className="relative">
              <textarea
                rows={3}
                value={f.value}
                onChange={(e) =>
                  setState((s) => ({ ...s, [f.key]: e.target.value }))
                }
                placeholder={f.placeholder}
                className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[12.5px] leading-[1.6] placeholder:text-stone-400 transition-all focus:outline-none resize-none"
                style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  color: INK,
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 0 3px rgba(255,90,77,0.18)`;
                  e.target.style.borderColor = ACCENT;
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "";
                  e.target.style.borderColor = "";
                }}
              />
              <div className="absolute bottom-2 right-3 font-mono text-[10px] text-stone-400">
                {f.value.length} chars
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Rivals ────────────────────────────────────────────────────────────
function StepRivals({
  rivals,
  setRivals,
}: {
  rivals: string[];
  setRivals: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const updateRival = (i: number, v: string) => {
    const next = [...rivals];
    next[i] = v;
    setRivals(next);
  };

  const detectKind = (val: string) => {
    if (!val) return "idle";
    if (val.startsWith("@")) return "handle";
    if (/^https?:\/\//.test(val) || /\.[a-z]{2,}/i.test(val)) return "url";
    return "handle";
  };

  return (
    <div
      className="px-1 py-6 sm:px-2 sm:py-8"
      style={{ animation: "stepIn .28s ease-out both" }}
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white">
          <Eye size={18} strokeWidth={1.75} style={{ color: ACCENT }} />
        </div>
        <div>
          <Eyebrow>03 — Rival context</Eyebrow>
          <h2
            className="mt-1 text-[26px] sm:text-[28px] font-semibold leading-tight"
            style={{ color: INK, letterSpacing: "-0.022em" }}
          >
            Who are your rivals?
          </h2>
          <p className="mt-1.5 text-[14px] text-stone-600 max-w-[58ch]">
            Provide at least 1 competitor&apos;s URL or X / LinkedIn handle.
            Hermes scrapes your competitor across every platform, finds their
            weaknesses, and writes counter-content for you.
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2.5">
          <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-stone-500">
            Rivals · {rivals.filter((r) => r).length}/3
          </div>
          <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-wide text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <Link2 size={11} /> URL
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AtSign size={11} /> handle
            </span>
          </div>
        </div>
        <div className="divide-y divide-stone-200">
          {rivals.map((val, i) => {
            const kind = detectKind(val);
            const required = i === 0;
            return (
              <div key={i} className="flex items-stretch">
                <div className="flex w-14 shrink-0 items-center justify-center border-r border-stone-200 bg-stone-50/40">
                  <span className="font-mono text-[12px] text-stone-400">
                    0{i + 1}
                  </span>
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    {kind === "handle" ? (
                      <AtSign size={14} />
                    ) : (
                      <Link2 size={14} />
                    )}
                  </span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateRival(i, e.target.value)}
                    placeholder={
                      i === 0
                        ? "https://competitor.com  or  @competitorHQ"
                        : i === 1
                          ? "Second rival (optional)"
                          : "Third rival (optional)"
                    }
                    className="w-full bg-transparent pl-10 pr-24 py-3.5 text-[14px] placeholder:text-stone-400 focus:outline-none"
                    style={{ color: INK }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {required && (
                      <span
                        className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: ACCENT,
                          background: "rgba(255,90,77,0.08)",
                        }}
                      >
                        REQ
                      </span>
                    )}
                    {val && (
                      <button
                        onClick={() => updateRival(i, "")}
                        className="text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hermes preview */}
      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white border border-stone-200">
            <span
              className="font-mono text-[12px] font-semibold"
              style={{ color: INK }}
            >
              H
            </span>
          </div>
          <div>
            <div
              className="text-[13px] font-semibold"
              style={{ color: INK }}
            >
              Hermes will analyze:
            </div>
            <div className="mt-1 text-[12.5px] text-stone-600 leading-relaxed">
              <span className="font-mono text-[11.5px] text-stone-500">→</span>{" "}
              Top-performing post structures · hooks · CTAs · posting cadence ·
              audience overlap · reply patterns
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Extension ─────────────────────────────────────────────────────────
function StepExtension() {
  return (
    <div
      className="px-1 py-6 sm:px-2 sm:py-8"
      style={{ animation: "stepIn .28s ease-out both" }}
    >
      <div className="text-center">
        <Eyebrow>04 — Deploy</Eyebrow>
        <h2
          className="mt-3 text-[28px] sm:text-[32px] font-semibold leading-tight max-w-[24ch] mx-auto"
          style={{ color: INK, letterSpacing: "-0.022em" }}
        >
          Install the Farcast Extension.
        </h2>
        <p className="mt-2 max-w-[58ch] mx-auto text-[14.5px] text-stone-600 leading-relaxed">
          Deploy your AI ghostwriter directly inside X and Reddit to farm
          upvotes and poach competitor audiences.
        </p>
      </div>

      <div className="mt-8 mx-auto max-w-[480px]">
        <div className="relative rounded-2xl border border-stone-200 bg-white p-5 overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center justify-between rounded-t-md border-b border-stone-100 pb-3">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((k) => (
                <span key={k} className="h-2.5 w-2.5 rounded-full bg-stone-200" />
              ))}
            </div>
            <div className="flex-1 mx-3 rounded-md bg-stone-50 px-3 py-1 font-mono text-[10.5px] text-stone-400 truncate">
              x.com/home
            </div>
            <div className="flex items-center gap-1.5">
              <Puzzle size={13} className="text-stone-300" />
              <div
                className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-white"
                style={{ background: ACCENT }}
              >
                F
              </div>
            </div>
          </div>

          {/* Ghost-reply preview */}
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50/40 p-3.5">
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <div
                className="grid h-5 w-5 place-items-center rounded-md text-[9.5px] font-bold text-white"
                style={{ background: ACCENT }}
              >
                F
              </div>
              <span className="font-mono tracking-wide uppercase text-[10px]">
                Farcast · ghost-reply
              </span>
              <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px]">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: ACCENT,
                    animation: "pulseDot 1.4s ease-in-out infinite",
                  }}
                />
                live
              </span>
            </div>
            <div
              className="mt-2 text-[13px] leading-snug"
              style={{ color: INK }}
            >
              <span className="text-stone-400">@</span>indiehacker:
              <span className="ml-1">
                struggling to get my first 100 users…
              </span>
            </div>
            <div className="mt-2.5 rounded-md border border-dashed border-stone-300 bg-white p-2.5">
              <div className="font-mono text-[10px] tracking-wider uppercase text-stone-400 mb-1">
                Suggested reply
              </div>
              <div
                className="text-[12.5px] leading-snug"
                style={{ color: INK }}
              >
                Been there. The trick isn&apos;t more traffic — it&apos;s being
                where your first 100 already complain. Reddit + 3 niche Slack
                groups got us to 80.
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9.5px] tracking-wider text-stone-400">
                    TONE
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{
                      color: ACCENT,
                      background: "rgba(255,90,77,0.08)",
                    }}
                  >
                    founder
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="rounded-md border border-stone-200 px-2 py-0.5 text-[10.5px] text-stone-600 hover:bg-stone-50">
                    Regenerate
                  </button>
                  <button
                    className="rounded-md px-2 py-0.5 text-[10.5px] text-white"
                    style={{ background: ACCENT }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: ThumbsUp, label: "Farm upvotes" },
              { icon: Users, label: "Poach audiences" },
              { icon: Sparkles, label: "Voice-matched" },
            ].map((f, i) => (
              <div
                key={i}
                className="rounded-lg bg-stone-50/60 border border-stone-200 px-2 py-2"
              >
                <f.icon
                  size={13}
                  className="mx-auto text-stone-500"
                  strokeWidth={1.75}
                />
                <div
                  className="mt-1 text-[10.5px] font-medium"
                  style={{ color: INK }}
                >
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Install CTA */}
        <div className="mt-5">
          <a
            href="https://chromewebstore.google.com/detail/farcast/kgkjlalfolfeaofoknkogcihgpkjcnmm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-semibold text-white transition hover:brightness-105"
            style={{
              backgroundColor: ACCENT,
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.18) inset, 0 12px 24px -10px rgba(255,90,77,0.55)",
            }}
          >
            <Puzzle size={17} strokeWidth={2} />
            <span>Install Puzzle Extension</span>
          </a>
          <div className="mt-3 flex items-center justify-center gap-4 font-mono text-[10.5px] tracking-wider uppercase text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={11} /> No data leaves your browser
            </span>
            <span className="h-3 w-px bg-stone-200" />
            <span>Chromium · v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export function OnboardingWizardV2() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [productState, setProductState] = useState<ProductState>({
    url: "",
    scanStatus: "idle",
    does: "",
    problem: "",
    who: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (url) {
      setProductState((prev) => ({ ...prev, url }));
      setStep(1);
    }
  }, []);
  const [rivals, setRivals] = useState<string[]>(["", "", ""]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [pipeline, setPipeline] = useState<PipelineStep[]>(INITIAL_PIPELINE);

  const isLast = step === STEPS.length - 1;
  const canContinue =
    step === 0
      ? true
      : step === 1
        ? productState.url.length > 0
        : step === 2
          ? rivals[0].trim().length > 0
          : true;

  const updatePipelineStep = (update: PipelineStep) => {
    setPipeline((prev) =>
      prev.map((p) => (p.step === update.step ? { ...p, ...update } : p))
    );
  };

  const buildFormData = (): WizardFormData => {
    const productName =
      extractProductName(productState.url) ||
      productState.does.split(" ").slice(0, 2).join(" ") ||
      "My Product";
    return {
      productName,
      productUrl: productState.url,
      productDescription: productState.does,
      problemItSolves: productState.problem,
      targetAudience: productState.who,
      industry: "",
      pricingModel: "freemium",
      pricePoint: "",
      primaryGoal: "first-100",
      timeline: "1-month",
      competitors: rivals.filter(Boolean),
    };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setPipeline(INITIAL_PIPELINE);
    const formData = buildFormData();

    try {
      const res = await fetch("/api/generate-playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          const event = JSON.parse(jsonStr);
          if (event.type === "progress") {
            updatePipelineStep(event.data as PipelineStep);
          } else if (event.type === "complete") {
            const { playbook, formData: fd } = event.data;
            const stored: StoredPlaybook = { playbook, formData: fd };
            localStorage.setItem(
              `playbook_${playbook.id}`,
              JSON.stringify(stored)
            );
            router.push(`/playbook/${playbook.id}`);
            return;
          } else if (event.type === "warning") {
            console.warn("[Playbook warning]", event.data.message);
          } else if (event.type === "error") {
            throw new Error(event.data.message);
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsGenerating(false);
      setPipeline(INITIAL_PIPELINE);
    }
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (isLast) {
      handleGenerate();
    } else {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const ctaLabel =
    step === 0
      ? "Let's go"
      : step === 1
        ? "Save & Continue"
        : step === 2
          ? "Run Hermes"
          : "Finish & Generate Playbook";

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#FFFCF8" }}
    >
      <Backdrop />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div
          className="relative w-full bg-white rounded-2xl border border-stone-200"
          style={{
            maxWidth: "640px",
            boxShadow:
              "0 1px 0 rgba(28,25,23,0.02), 0 24px 60px -20px rgba(28,25,23,0.12), 0 8px 24px -8px rgba(28,25,23,0.06)",
          }}
        >
          {/* Modal header */}
          {!isGenerating && (
            <div className="flex items-center justify-between gap-6 border-b border-stone-100 px-6 sm:px-8 py-5">
              <div className="flex items-center gap-2.5 shrink-0">
                <div
                  className="grid h-7 w-7 place-items-center rounded-md text-white text-[13px] font-bold"
                  style={{ background: ACCENT }}
                >
                  F
                </div>
                <div className="flex flex-col leading-tight">
                  <span
                    className="text-[13.5px] font-semibold"
                    style={{ color: INK }}
                  >
                    Farcast
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                    operator · setup
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0 max-w-[320px]">
                <StepBar current={step} />
              </div>
              <button
                onClick={() => router.push("/dashboard")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Modal body */}
          {isGenerating ? (
            <div className="px-6 sm:px-8 py-8 space-y-8">
              <div className="text-center">
                <h2
                  className="text-2xl sm:text-3xl font-extrabold"
                  style={{ color: INK }}
                >
                  Building your playbook...
                </h2>
                <p className="text-stone-500 text-sm mt-2">
                  Our AI is crafting a growth strategy for{" "}
                  <span className="font-semibold" style={{ color: ACCENT }}>
                    {extractProductName(productState.url)}
                  </span>
                </p>
              </div>

              <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-200">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    AI Pipeline —{" "}
                    {pipeline.filter((p) => p.status === "done").length}/
                    {pipeline.length} steps complete
                  </p>
                </div>
                <div className="divide-y divide-stone-200">
                  {pipeline.map((p) => (
                    <div key={p.step} className="flex items-start gap-4 p-5">
                      <div className="shrink-0 mt-0.5">
                        {p.status === "done" ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        ) : p.status === "running" ||
                          p.status === "partial" ? (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(255,90,77,0.10)" }}
                          >
                            <Loader2
                              className="w-4 h-4 animate-spin"
                              style={{ color: ACCENT }}
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-stone-300">
                              {p.step}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color:
                              p.status === "done"
                                ? "#10b981"
                                : p.status === "running" ||
                                    p.status === "partial"
                                  ? INK
                                  : "#d4d4d4",
                          }}
                        >
                          {p.label}
                          {p.substep && (
                            <span className="ml-2 text-xs text-stone-400">
                              ({p.substep})
                            </span>
                          )}
                        </p>
                        {p.preview && p.status === "done" && (
                          <p className="text-xs text-stone-400 mt-0.5 truncate">
                            {p.preview}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="flex items-center gap-3 rounded-2xl px-5 py-4 border"
                style={{
                  background: "rgba(255,90,77,0.05)",
                  borderColor: "rgba(255,90,77,0.10)",
                }}
              >
                <span className="text-xl">🎯</span>
                <p className="text-sm text-stone-600">
                  <span className="font-semibold" style={{ color: ACCENT }}>
                    Expert knowledge injected.
                  </span>{" "}
                  Each channel strategy is powered by our curated playbooks —
                  not generic AI advice.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={() => {
                      setIsGenerating(false);
                      setError("");
                    }}
                    className="mt-3 text-sm underline hover:no-underline"
                    style={{ color: ACCENT }}
                  >
                    Go back and try again
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="max-h-[68vh] overflow-y-auto px-6 sm:px-8"
              style={{ scrollbarWidth: "thin" }}
            >
              {step === 0 && <StepWelcome />}
              {step === 1 && (
                <StepProduct state={productState} setState={setProductState} />
              )}
              {step === 2 && (
                <StepRivals rivals={rivals} setRivals={setRivals} />
              )}
              {step === 3 && <StepExtension />}
            </div>
          )}

          {/* Modal footer */}
          {!isGenerating && (
            <div
              className="flex items-center justify-between gap-3 border-t border-stone-100 px-6 sm:px-8 py-4 rounded-b-2xl"
              style={{ background: "rgba(245,245,244,0.4)" }}
            >
              <div className="flex items-center gap-3">
                {step > 0 ? (
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[14px] font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>
                ) : (
                  <div className="font-mono text-[11px] tracking-wider uppercase text-stone-400">
                    Step{" "}
                    <span style={{ color: INK }}>
                      {String(step + 1).padStart(2, "0")}
                    </span>{" "}
                    / 04
                  </div>
                )}
                {step === 3 && (
                  <button
                    onClick={handleNext}
                    className="text-[13px] font-medium text-stone-500 hover:text-stone-700 underline-offset-4 hover:underline transition-colors"
                  >
                    Skip extension
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10.5px] tracking-wider uppercase text-stone-400">
                  <kbd
                    className="px-1.5 py-0.5 rounded bg-white text-[10px]"
                    style={{
                      border: "1px solid rgba(28,25,23,0.14)",
                      borderBottomWidth: "2px",
                    }}
                  >
                    ←
                  </kbd>
                  <kbd
                    className="px-1.5 py-0.5 rounded bg-white text-[10px]"
                    style={{
                      border: "1px solid rgba(28,25,23,0.14)",
                      borderBottomWidth: "2px",
                    }}
                  >
                    →
                  </kbd>
                  <span>navigate</span>
                </div>
                <button
                  onClick={handleNext}
                  disabled={!canContinue}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canContinue
                      ? ACCENT
                      : "rgba(28,25,23,0.18)",
                    boxShadow: canContinue
                      ? "0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 18px -8px rgba(255,90,77,0.55)"
                      : "none",
                  }}
                >
                  <span>{ctaLabel}</span>
                  {isLast ? (
                    <Sparkles size={14} />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
