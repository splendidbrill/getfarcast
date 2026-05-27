"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Hash,
  Loader2,
  Plug,
  Plus,
  Save,
  Settings2,
  TriangleAlert,
  Trash2,
  Unplug,
} from "lucide-react";
import type { CompetitorHandle, Playbook } from "@/lib/types";
import { updatePlaybookSettings } from "@/app/playbook/actions";

const INK = "#171717";
const INK2 = "#3F3F3F";
const MUTE = "#737373";
const MUTE2 = "#A3A3A3";
const LINE = "#E7E5E0";
const PAPER = "#FAFAF7";
const CARD = "#FFFFFF";
const CORAL = "#F04E23";
const CORAL2 = "#D84111";

function XGlyph({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function LinkedinGlyph({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 13v4" />
    </svg>
  );
}

function inferPlatform(handle: string): "x" | "linkedin" {
  return handle.startsWith("in/") || handle.startsWith("company/") ? "linkedin" : "x";
}

function toCompetitorObjects(raw: unknown): CompetitorHandle[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c): CompetitorHandle | null => {
      if (typeof c === "string") {
        const h = c.trim();
        if (!h) return null;
        return { handle: h, platform: inferPlatform(h) };
      }
      if (c && typeof c === "object" && "handle" in c) {
        const obj = c as { handle: unknown; platform?: unknown };
        const handle = String(obj.handle).trim();
        if (!handle) return null;
        const platform: CompetitorHandle["platform"] = obj.platform === "linkedin" ? "linkedin" : "x";
        return { handle, platform };
      }
      return null;
    })
    .filter((c): c is CompetitorHandle => c !== null);
}

interface SettingsViewProps {
  playbook: Playbook;
  playbookId: string;
  onPlaybookChange: (next: Playbook) => void;
}

export function SettingsView({ playbook, playbookId, onPlaybookChange }: SettingsViewProps) {
  // ── Context form state ──────────────────────────────────────────────────────
  const initialCtx = {
    productUrl: playbook.productUrl ?? "",
    productName: playbook.productName ?? "",
    productDesc: playbook.productDescription ?? playbook.summary ?? "",
    painPoint: playbook.painPoint ?? "",
  };
  const [ctx, setCtx] = useState(initialCtx);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // ── Competitors state ───────────────────────────────────────────────────────
  const [competitors, setCompetitors] = useState<CompetitorHandle[]>(
    toCompetitorObjects(playbook.competitors)
  );
  const [newHandle, setNewHandle] = useState("");
  const [newPlatform, setNewPlatform] = useState<"x" | "linkedin">("x");
  const [competitorsSaving, setCompetitorsSaving] = useState(false);
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);

  // ── Integrations (local-only mock; design calls for these but no backend yet)
  const [slackConnected, setSlackConnected] = useState(true);
  const [xConnected, setXConnected] = useState(false);

  useEffect(() => {
    setCtx({
      productUrl: playbook.productUrl ?? "",
      productName: playbook.productName ?? "",
      productDesc: playbook.productDescription ?? playbook.summary ?? "",
      painPoint: playbook.painPoint ?? "",
    });
    setCompetitors(toCompetitorObjects(playbook.competitors));
  }, [playbook]);

  const setField = (k: keyof typeof ctx) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCtx((prev) => ({ ...prev, [k]: e.target.value }));
    setSaved(false);
    setSaveError(null);
  };

  const persistLocal = (next: Playbook) => {
    try {
      const raw = localStorage.getItem(`playbook_${playbookId}`);
      const stored = raw ? JSON.parse(raw) : { playbook: next, formData: {} };
      const formData = stored.formData ?? {};
      const merged = {
        playbook: next,
        formData: {
          ...formData,
          productName: next.productName,
          productUrl: next.productUrl ?? formData.productUrl,
          productDescription: next.productDescription ?? formData.productDescription,
          problemItSolves: next.painPoint ?? formData.problemItSolves,
          competitors: next.competitors?.map((c) => c.handle) ?? formData.competitors,
        },
      };
      localStorage.setItem(`playbook_${playbookId}`, JSON.stringify(merged));
    } catch {}
  };

  const saveCtx = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const { playbook: nextPlaybook } = await updatePlaybookSettings(playbookId, {
        productName: ctx.productName.trim(),
        productUrl: ctx.productUrl.trim(),
        productDescription: ctx.productDesc.trim(),
        painPoint: ctx.painPoint.trim(),
      });
      onPlaybookChange(nextPlaybook);
      persistLocal(nextPlaybook);
      setSaved(true);
      setLastSavedAt(new Date());
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const normalizeHandle = (raw: string, platform: "x" | "linkedin") => {
    const h = raw.trim().replace(/^@+/, "");
    if (!h) return "";
    if (platform === "linkedin") return h.startsWith("in/") || h.startsWith("company/") ? h : `in/${h}`;
    return `@${h}`;
  };

  const commitCompetitors = async (next: CompetitorHandle[]) => {
    setCompetitors(next);
    setCompetitorsSaving(true);
    setCompetitorsError(null);
    try {
      const { playbook: nextPlaybook } = await updatePlaybookSettings(playbookId, { competitors: next });
      onPlaybookChange(nextPlaybook);
      persistLocal(nextPlaybook);
    } catch (e) {
      setCompetitorsError(e instanceof Error ? e.message : "Failed to save competitors");
    } finally {
      setCompetitorsSaving(false);
    }
  };

  const addCompetitor = () => {
    const normalized = normalizeHandle(newHandle, newPlatform);
    if (!normalized) return;
    if (competitors.some((c) => c.handle.toLowerCase() === normalized.toLowerCase())) {
      setNewHandle("");
      return;
    }
    if (competitors.length >= 20) return;
    const next = [...competitors, { handle: normalized, platform: newPlatform }];
    setNewHandle("");
    void commitCompetitors(next);
  };

  const removeCompetitor = (handle: string) => {
    void commitCompetitors(competitors.filter((c) => c.handle !== handle));
  };

  // ── styles ────────────────────────────────────────────────────────────────
  const inputCls = "w-full rounded-md border bg-white px-3 py-2 text-[13px] leading-[1.5] text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2";
  const inputStyle: React.CSSProperties = {
    borderColor: LINE,
  };
  const focusRing = "focus:border-[#F04E23]/50 focus:ring-[#F04E23]/15";

  const Label = ({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) => (
    <div className="mb-2 flex items-baseline justify-between">
      <label className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: INK }}>{children}</label>
      {hint && <span className="font-mono text-[10.5px]" style={{ color: MUTE }}>{hint}</span>}
    </div>
  );

  const lastSavedLabel = lastSavedAt
    ? lastSavedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()
    : null;

  return (
    <div className="min-h-full" style={{ background: PAPER }}>
      {/* Page header */}
      <section className="px-8 pt-8 pb-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: MUTE }}>
            workspace · {playbook.productName?.toLowerCase() || "farcast"}
          </div>
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em]" style={{ color: INK }}>
            settings.
          </h1>
          <p className="mt-2 max-w-[640px] text-[13px]" style={{ color: MUTE }}>
            Manage your Farcast engine, context, and integrations. Updates here propagate everywhere Hermes reads from.
          </p>
        </div>
      </section>

      <main className="flex flex-col gap-6 px-8 pb-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">

          {/* CARD 1 · CORE APP CONTEXT */}
          <article className="overflow-hidden rounded-lg border" style={{ borderColor: LINE, background: CARD }}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: LINE, background: `${PAPER}99` }}>
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.12em]" style={{ color: MUTE }}>
                  card 01 · agent context
                </div>
                <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: INK }}>Core app context</h2>
                <p className="mt-1 text-[12.5px]" style={{ color: MUTE }}>
                  The source-of-truth Hermes reads from every time it drafts a post, reply, or DM. Keep this tight.
                </p>
              </div>
              <span className="shrink-0 rounded-md border px-2 py-[3px] font-mono text-[10.5px]"
                style={{ borderColor: LINE, background: PAPER, color: MUTE }}>
                read by hermes · live
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
              <div>
                <Label hint="https://">Product URL</Label>
                <input type="url" value={ctx.productUrl} onChange={setField("productUrl")}
                  placeholder="https://your-product.com"
                  className={`${inputCls} ${focusRing}`} style={inputStyle} />
              </div>
              <div>
                <Label>Product name</Label>
                <input type="text" value={ctx.productName} onChange={setField("productName")}
                  placeholder="e.g. Farcast"
                  className={`${inputCls} ${focusRing}`} style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <Label hint={`${ctx.productDesc.length} / 600`}>Product description</Label>
                <textarea rows={4} value={ctx.productDesc} onChange={setField("productDesc")} maxLength={600}
                  placeholder="One paragraph that explains what your product is and who it is for."
                  className={`${inputCls} ${focusRing} resize-y`} style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <Label hint="One specific problem · in your customer's words">Core pain point solved</Label>
                <textarea rows={3} value={ctx.painPoint} onChange={setField("painPoint")}
                  placeholder="The exact frustration your buyer types into Reddit at 11pm."
                  className={`${inputCls} ${focusRing} resize-y`} style={inputStyle} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3" style={{ borderColor: LINE, background: `${PAPER}99` }}>
              <span className="font-mono text-[10.5px]" style={{ color: MUTE }}>
                {lastSavedLabel ? `last saved · today, ${lastSavedLabel}` : "unsaved · click save to push updates"}
              </span>
              <div className="flex items-center gap-2">
                {saveError && <span className="font-mono text-[11px] text-rose-600">{saveError}</span>}
                {saved && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700">
                    <Check size={12} strokeWidth={2.2} /> saved · propagated to all tabs
                  </span>
                )}
                <button onClick={saveCtx} disabled={saving}
                  className="flex h-8 items-center gap-1.5 rounded-md px-3.5 font-mono text-[12.5px] font-medium text-white ring-1 ring-inset disabled:opacity-60"
                  style={{ background: CORAL, ["--tw-ring-color" as string]: CORAL2 }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} strokeWidth={2} />}
                  {saving ? "Saving…" : "Save context"}
                </button>
              </div>
            </div>
          </article>

          {/* CARD 2 · RIVAL SPYING / COMPETITORS */}
          <article className="overflow-hidden rounded-lg border" style={{ borderColor: LINE, background: CARD }}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: LINE, background: `${PAPER}99` }}>
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.12em]" style={{ color: MUTE }}>
                  card 02 · rival spying
                </div>
                <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: INK }}>Competitors monitored</h2>
                <p className="mt-1 text-[12.5px]" style={{ color: MUTE }}>
                  Hermes watches what these accounts post and who engages with them. Their replies become your warm-lead candidates.
                </p>
              </div>
              <span className="shrink-0 rounded-md border px-2 py-[3px] font-mono text-[10.5px]"
                style={{ borderColor: LINE, background: PAPER, color: MUTE }}>
                {competitors.length} of 20
              </span>
            </div>

            <ul>
              {competitors.length === 0 && (
                <li className="px-5 py-6 text-center font-mono text-[12px]" style={{ color: MUTE }}>
                  no competitors tracked yet · add one below to start spying.
                </li>
              )}
              {competitors.map((c, i) => (
                <li key={c.handle} className={`flex items-center justify-between gap-3 px-5 py-3 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: LINE }}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                      c.platform === "linkedin"
                        ? "border-blue-100 bg-blue-50 text-blue-700"
                        : "border-transparent text-white"
                    }`}
                      style={c.platform === "linkedin" ? undefined : { background: INK, borderColor: LINE }}>
                      {c.platform === "linkedin" ? <LinkedinGlyph size={13} /> : <XGlyph size={12} />}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-mono text-[13px] font-medium" style={{ color: INK }}>{c.handle}</span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: MUTE }}>
                        {c.platform === "linkedin" ? "linkedin" : "x · twitter"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeCompetitor(c.handle)}
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-rose-50 hover:text-rose-600"
                    style={{ color: MUTE }}
                    aria-label={`remove ${c.handle}`}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center" style={{ borderColor: LINE, background: `${PAPER}99` }}>
              <div className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-white p-0.5 ring-1 ring-inset" style={{ ["--tw-ring-color" as string]: LINE }}>
                {(["x", "linkedin"] as const).map((p) => {
                  const isActive = newPlatform === p;
                  return (
                    <button key={p} onClick={() => setNewPlatform(p)}
                      className={`flex h-7 items-center gap-1.5 rounded-[5px] px-2 font-mono text-[11px] transition-colors ${
                        isActive ? "text-white" : "hover:opacity-80"
                      }`}
                      style={isActive ? { background: INK } : { color: MUTE }}>
                      {p === "linkedin" ? <LinkedinGlyph size={11} /> : <XGlyph size={11} />}
                      {p === "linkedin" ? "LinkedIn" : "X"}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-md border bg-white px-3 py-1.5"
                style={{ borderColor: LINE }}>
                <span className="font-mono text-[12px]" style={{ color: MUTE2 }}>
                  {newPlatform === "linkedin" ? "in/" : "@"}
                </span>
                <input value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
                  placeholder={`add new ${newPlatform === "linkedin" ? "linkedin" : "x"} handle`}
                  className="flex-1 bg-transparent text-[13px] focus:outline-none placeholder:text-[#A3A3A3]"
                  style={{ color: INK }} />
              </div>
              <button onClick={addCompetitor}
                disabled={!newHandle.trim() || competitors.length >= 20 || competitorsSaving}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3.5 font-mono text-[12.5px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: INK }}>
                {competitorsSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} strokeWidth={2} />}
                Add
              </button>
            </div>
            {competitorsError && (
              <div className="border-t px-5 py-2 font-mono text-[11px] text-rose-600" style={{ borderColor: LINE }}>
                {competitorsError}
              </div>
            )}
          </article>

          {/* CARD 3 · INTEGRATIONS */}
          <article className="overflow-hidden rounded-lg border" style={{ borderColor: LINE, background: CARD }}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: LINE, background: `${PAPER}99` }}>
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.12em]" style={{ color: MUTE }}>
                  card 03 · integrations
                </div>
                <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: INK }}>Connected channels &amp; tools</h2>
                <p className="mt-1 text-[12.5px]" style={{ color: MUTE }}>
                  Hermes plugs into your stack. Notifications, posting accounts, and deploy targets live here.
                </p>
              </div>
              <span className="shrink-0 rounded-md border px-2 py-[3px] font-mono text-[10.5px]"
                style={{ borderColor: LINE, background: PAPER, color: MUTE }}>
                {(slackConnected ? 1 : 0) + (xConnected ? 1 : 0)} of 2 connected
              </span>
            </div>

            {/* SLACK */}
            <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: LINE }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: LINE, background: PAPER }}>
                  <Hash size={20} strokeWidth={2} className="text-[#611f69]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold tracking-tight" style={{ color: INK }}>Slack Lead Routing</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] ${
                      slackConnected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : ""
                    }`}
                      style={slackConnected ? undefined : { borderColor: LINE, background: PAPER, color: MUTE }}>
                      <span className={`h-1.5 w-1.5 rounded-full ${slackConnected ? "bg-emerald-600" : ""}`}
                        style={slackConnected ? undefined : { background: MUTE2 }} />
                      {slackConnected ? "connected" : "not connected"}
                    </span>
                  </div>
                  <p className="mt-1 max-w-[460px] text-[12.5px] leading-[1.55]" style={{ color: MUTE }}>
                    Push high-intent warm leads directly to a Slack channel as soon as Hermes finds them.
                  </p>
                  {slackConnected && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10.5px]" style={{ color: MUTE }}>
                      <span className="flex items-center gap-1"><Hash size={10} /> workspace · farcast-team</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Hash size={10} /> channel · #warm-leads</span>
                      <span>·</span>
                      <span>routes hot leads only</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                {slackConnected ? (
                  <>
                    <button className="flex h-8 items-center gap-1.5 rounded-md bg-white px-3 font-mono text-[11.5px] ring-1 ring-inset transition-colors hover:bg-[#F6F4EF]"
                      style={{ color: INK2, ["--tw-ring-color" as string]: LINE }}>
                      <Settings2 size={12} /> Configure channel
                    </button>
                    <button onClick={() => setSlackConnected(false)}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-white px-3 font-mono text-[11.5px] text-rose-600 ring-1 ring-inset ring-rose-200 transition-colors hover:bg-rose-50">
                      <Unplug size={12} /> Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={() => setSlackConnected(true)}
                    className="flex h-9 items-center gap-1.5 rounded-md px-3.5 font-mono text-[12.5px] font-medium text-white ring-1 ring-inset"
                    style={{ background: CORAL, ["--tw-ring-color" as string]: CORAL2 }}>
                    <Plug size={13} strokeWidth={2} /> Connect Slack
                  </button>
                )}
              </div>
            </div>

            {/* X / TWITTER */}
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-white"
                  style={{ borderColor: LINE, background: INK }}>
                  <XGlyph size={18} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold tracking-tight" style={{ color: INK }}>X Account Connection</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] ${
                      xConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""
                    }`}
                      style={xConnected ? undefined : { borderColor: LINE, background: PAPER, color: MUTE }}>
                      <span className={`h-1.5 w-1.5 rounded-full ${xConnected ? "bg-emerald-600" : ""}`}
                        style={xConnected ? undefined : { background: MUTE2 }} />
                      {xConnected ? "connected" : "not connected"}
                    </span>
                  </div>
                  <p className="mt-1 max-w-[460px] text-[12.5px] leading-[1.55]" style={{ color: MUTE }}>
                    Connect your primary founder account so the Chrome Extension can draft, queue, and deploy posts and DMs on your behalf.
                  </p>
                  {!xConnected && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-amber-700">
                      <TriangleAlert size={11} className="text-amber-600" />
                      <span>not connected · the extension will run in read-only mode until you authorize an account</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <button onClick={() => setXConnected(!xConnected)}
                  className={`flex h-9 items-center gap-1.5 rounded-md px-3.5 font-mono text-[12.5px] font-medium ring-1 ring-inset ${
                    xConnected
                      ? "bg-white text-rose-600 ring-rose-200 hover:bg-rose-50"
                      : "text-white"
                  }`}
                  style={xConnected ? undefined : { background: CORAL, ["--tw-ring-color" as string]: CORAL2 }}>
                  {xConnected ? <Unplug size={13} strokeWidth={2} /> : <Plug size={13} strokeWidth={2} />}
                  {xConnected ? "Disconnect" : "Connect Account"}
                </button>
              </div>
            </div>

            <div className="border-t px-5 py-3" style={{ borderColor: LINE, background: `${PAPER}99` }}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]" style={{ color: MUTE }}>
                <span>oauth scopes · read · post · dm</span>
                <span style={{ color: MUTE2 }}>·</span>
                <span>tokens stored encrypted (AES-256)</span>
                <span style={{ color: MUTE2 }}>·</span>
                <a href="#" className="hover:underline" style={{ color: CORAL2 }}>view integration logs →</a>
              </div>
            </div>
          </article>

          {/* DANGER ZONE — small footer */}
          <article className="flex flex-col items-start justify-between gap-3 rounded-lg border px-5 py-4 sm:flex-row sm:items-center"
            style={{ borderColor: LINE, background: CARD }}>
            <div>
              <div className="text-[13.5px] font-semibold" style={{ color: INK }}>Danger zone</div>
              <div className="font-mono text-[11px]" style={{ color: MUTE }}>
                disconnects all channels · purges voice profile · cancels billing.
              </div>
            </div>
            <button className="flex h-8 items-center gap-1.5 rounded-md bg-white px-3 font-mono text-[12px] text-rose-600 ring-1 ring-inset ring-rose-200 transition-colors hover:bg-rose-50">
              <Trash2 size={12} /> Delete workspace
            </button>
          </article>

        </div>
      </main>
    </div>
  );
}
