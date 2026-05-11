"use client";

import { useState } from "react";

interface Props {
  content: string;
  platform: "twitter" | "linkedin";
  playbookId?: string;
}

// Adds 1–14 minutes of random variance to look organic and bypass rigid post-detection windows.
function applyHumanVariance(date: Date): Date {
  const jitterMs = (Math.floor(Math.random() * 14) + 1) * 60_000;
  return new Date(date.getTime() + jitterMs);
}

function defaultDatetimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  // datetime-local requires "YYYY-MM-DDTHH:mm"
  return d.toISOString().slice(0, 16);
}

const CalIcon = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor"
    strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l4 4 10-10" />
  </svg>
);

export function SchedulePost({ content, platform, playbookId }: Props) {
  const [open, setOpen] = useState(false);
  const [datetime, setDatetime] = useState(defaultDatetimeLocal);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const label = platform === "twitter" ? "X" : "LI";
  const fullLabel = platform === "twitter" ? "X (Twitter)" : "LinkedIn";

  const handleSchedule = async () => {
    if (!datetime) return;
    setStatus("loading");
    setMsg("");
    try {
      const base = new Date(datetime);
      const finalDate = applyHumanVariance(base);
      const res = await fetch("/api/postiz/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform,
          scheduledFor: finalDate.toISOString(),
          playbookId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scheduling failed");
      const readableTime = finalDate.toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      setStatus("success");
      setMsg(`Queued for ${readableTime} on ${fullLabel}`);
      setTimeout(() => { setOpen(false); setStatus("idle"); setDatetime(defaultDatetimeLocal()); }, 3500);
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <div>
      <button
        onClick={() => { setOpen(o => !o); setStatus("idle"); setMsg(""); }}
        className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-medium transition-colors
          ${open
            ? "bg-slate-900 text-white"
            : "bg-white border border-[#E2E8F0] text-slate-500 hover:text-slate-900"}`}
      >
        <CalIcon />
        auto post {label}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-3">
          <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-slate-400">
            schedule to {fullLabel}
          </div>

          <input
            type="datetime-local"
            value={datetime}
            onChange={e => { setDatetime(e.target.value); setStatus("idle"); setMsg(""); }}
            className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-[13px] text-slate-800
              bg-[#FBFAF7] focus:outline-none focus:border-slate-300 transition-colors"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleSchedule}
              disabled={status === "loading" || status === "success" || !datetime}
              className={`flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12px] font-medium transition-all
                ${status === "success"
                  ? "bg-emerald-500 text-white"
                  : "bg-[#F25C2C] text-white hover:bg-[#E0501F] shadow-[0_2px_8px_-2px_rgba(242,92,44,0.5)] disabled:opacity-50"}`}
            >
              {status === "loading" && (
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}
              {status === "success" && <CheckIcon />}
              {status === "loading" ? "scheduling…" : status === "success" ? "scheduled" : "schedule post"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              cancel
            </button>
          </div>

          {status === "success" && (
            <p className="text-[12px] text-emerald-600 flex items-center gap-1.5">
              <CheckIcon />{msg}
            </p>
          )}
          {status === "error" && (
            <p className="text-[12px] text-red-500">{msg}</p>
          )}
          {status === "idle" && (
            <p className="text-[11px] text-slate-400 font-mono">
              ±1–14 min jitter applied automatically.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
