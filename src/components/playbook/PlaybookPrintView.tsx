"use client";

import type { Playbook } from "@/lib/types";
import { PlaybookOverview } from "./PlaybookOverview";
import { PlaybookICP } from "./PlaybookICP";

// ── Print-safe Content Calendar ─────────────────────────────────────────────
// Renders contentCalendar data directly from the playbook — no API calls,
// no interactive state. Safe to render off-screen for window.print().

function PrintContentCalendar({ playbook }: { playbook: Playbook }) {
  return (
    <div className="space-y-10">
      {playbook.channels
        .sort((a, b) => a.rank - b.rank)
        .map((channel) => (
          <div key={channel.name} className="space-y-4">
            {/* Channel header */}
            <div className="flex items-center gap-3 pb-2 border-b-2 border-[#ff6b4e]/30">
              <span
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  channel.pushType === "hard"
                    ? "bg-[#ff6b4e] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                #{channel.rank}
              </span>
              <div>
                <h3 className="text-base font-bold text-[#1a1a2e]">{channel.name}</h3>
                <p className="text-xs text-gray-500">
                  {channel.pushType === "hard" ? "Primary channel" : "Secondary channel"} ·{" "}
                  {channel.fitScore}% fit · {channel.contentCalendar?.length ?? 0} posts planned
                </p>
              </div>
            </div>

            {/* Rationale */}
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
              {channel.rationale}
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Expected CAC", value: channel.cac || "Organic / $0" },
                { label: "Time to ROI", value: channel.timeToRoi || "2–4 weeks" },
                {
                  label: "Best Posting Times",
                  value: channel.bestPostingTimes?.join(", ") || "Check analytics",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white border border-gray-100 rounded-xl p-3"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {s.label}
                  </p>
                  <p className="text-xs font-semibold text-[#1a1a2e]">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Content calendar posts */}
            {channel.contentCalendar && channel.contentCalendar.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  30-Day Content Calendar ({channel.contentCalendar.length} posts)
                </h4>
                <div className="space-y-3">
                  {channel.contentCalendar.map((post, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-100 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#ff6b4e]/10 text-[#ff6b4e] px-2 py-0.5 rounded-md uppercase">
                          Day {post.day}
                        </span>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">
                          {post.type}
                        </span>
                        <span className="text-xs font-semibold text-[#1a1a2e]">{post.title}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-700 italic">&ldquo;{post.hook}&rdquo;</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {post.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No content calendar available.</p>
            )}

            {/* Best practices & anti-patterns */}
            <div className="grid grid-cols-2 gap-4">
              {channel.bestPractices && channel.bestPractices.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                    ✓ What To Do
                  </h4>
                  <ul className="space-y-1.5">
                    {channel.bestPractices.map((bp, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="text-emerald-500 shrink-0">•</span>
                        {bp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {channel.antiPatterns && channel.antiPatterns.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">
                    ✗ What Kills Reach
                  </h4>
                  <ul className="space-y-1.5">
                    {channel.antiPatterns.map((ap, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="text-red-500 shrink-0">•</span>
                        {ap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

// ── Algorithm Insights Print Page ────────────────────────────────────────────

function PrintAlgorithmInsights({ playbook }: { playbook: Playbook }) {
  return (
    <div className="space-y-6">
      {playbook.channels
        .sort((a, b) => a.rank - b.rank)
        .filter((ch) => ch.algorithmInsights && ch.algorithmInsights.length > 0)
        .map((channel) => (
          <div
            key={channel.name}
            className="bg-blue-50 border border-blue-100 rounded-xl p-5"
          >
            <h3 className="text-sm font-bold text-blue-900 mb-3">
              {channel.name} — Expert Algorithm Insights
            </h3>
            <ul className="space-y-2">
              {channel.algorithmInsights.map((ins, i) => (
                <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                  {ins}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export function PlaybookPrintView({ playbook }: { playbook: Playbook }) {
  return (
    <div className="print-all-container" aria-hidden="true">
      {/* Cover / Branding */}
      <div className="print-section print-cover">
        <div className="flex items-center gap-3 mb-8">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #ff6b4e, #ff8c5a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 18, fontWeight: 900 }}>G</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>
            Get<span style={{ color: "#ff6b4e" }}>Farcast</span>
          </span>
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#1a1a2e",
            marginBottom: 8,
          }}
        >
          {playbook.productName} — Distribution Playbook
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
          {playbook.summary}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {[
            { label: "ICP", value: playbook.icp.title.split(",")[0] },
            { label: "Channels", value: `${playbook.channels.length} mapped` },
            {
              label: "Content Templates",
              value: `${playbook.channels.reduce((s, c) => s + (c.contentCalendar?.length ?? 0), 0)} posts`,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff7f5",
                border: "1px solid #ffd5cc",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#ff6b4e",
                  marginBottom: 4,
                }}
              >
                {s.label}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 1: Executive Summary + Market Sizing */}
      <div className="print-section print-page-break">
        <h1 className="print-section-title">Executive Summary &amp; Market Sizing</h1>
        <PlaybookOverview playbook={playbook} />
      </div>

      {/* Section 2: Audience Profiling */}
      <div className="print-section print-page-break">
        <h1 className="print-section-title">Audience Profiling (ICP)</h1>
        <PlaybookICP icp={playbook.icp} />
      </div>

      {/* Section 3: Distribution Channels + Calendars */}
      <div className="print-section print-page-break">
        <h1 className="print-section-title">Distribution Channels &amp; 30-Day Content Calendars</h1>
        <PrintContentCalendar playbook={playbook} />
      </div>

      {/* Section 4: Algorithm Insights */}
      <div className="print-section print-page-break">
        <h1 className="print-section-title">Expert Algorithm Insights</h1>
        <PrintAlgorithmInsights playbook={playbook} />
      </div>
    </div>
  );
}
