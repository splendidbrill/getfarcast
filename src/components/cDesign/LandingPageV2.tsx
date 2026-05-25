"use client";

import "./landing.css";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingNav } from "./LandingNav";
import { LandingFAQ } from "./LandingFAQ";
import { LandingFooter } from "./LandingFooter";
import { PricingCTA } from "./PricingCTA";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const ArrowIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
  </svg>
);
const CheckIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);
const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
const SparkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);
const BotIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="7" width="16" height="13" rx="3" /><path d="M12 3v4M8 12v2M16 12v2" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
  </svg>
);
const ReplyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c0-4 3-7 7-7h7a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4h-7l-4 4v-4H6a3 3 0 0 1-3-3Z" />
  </svg>
);
const XIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2H21l-6.49 7.41L22 22h-6.99l-4.74-6.16L4.8 22H2.04l6.96-7.95L2 2h7.16l4.27 5.65L18.244 2Zm-1.22 18.39h1.66L7.06 3.5H5.3l11.724 16.89Z" />
  </svg>
);
const RedditIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <circle cx="9" cy="13" r="1.1" fill="#fff" />
    <circle cx="15" cy="13" r="1.1" fill="#fff" />
    <path d="M8.5 15.6c1 .9 2.2 1.3 3.5 1.3s2.5-.4 3.5-1.3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.4c0-1.29-.02-2.94-1.79-2.94-1.8 0-2.07 1.4-2.07 2.85V21h-4V9Z" />
  </svg>
);

// ─── Dashboard mock ───────────────────────────────────────────────────────────
const DRAFTS = [
  { p: "x",  tag: "thread", title: "The boring growth loop nobody talks about",        body: "Shipping isn't a launch, it's a beat. Last week we shipped twice and posted twice. The compounding looks like nothing for six weeks and then…", intent: 94, len: "6 posts" },
  { p: "li", tag: "post",   title: "What I'd do differently if I started today",        body: "Spent four months posting twice a week. Here's the post cadence I should've run from day one — and the one I'd skip entirely.", intent: 71, len: "212 words" },
  { p: "rd", tag: "reply",  title: "r/SaaS · weekly self-promo thread",                body: "OP — I ran a similar playbook last quarter. The 90/10 rule is real, but the part nobody mentions is that the 10% has to be earned in a specific shape:", intent: 58, len: "148 words" },
  { p: "x",  tag: "single", title: "Hook · pricing objection",                         body: "$50/mo for an AI co-founder sounds steep until you remember the alternative is a $7,500 retainer and three Slack channels.", intent: 66, len: "1 post" },
];

const LEADS = [
  { n: "@mira_builds",   bio: "building billing API · 2 mo in",       sig: "replied to @stripe",              s: 94, hot: true },
  { n: "@otto.dev",      bio: "ex-Stripe · scoping crm tool",          sig: "posted: 'what crm should i use'", s: 88, hot: true },
  { n: "@hellofelix",    bio: "indie · stuck at $4k MRR",              sig: "following 6 competitors",         s: 81, hot: true },
  { n: "@dana_runs",     bio: "agency owner · 12 clients",             sig: "liked 3 of your posts",           s: 74, hot: false },
  { n: "@solomon.codes", bio: "shipping a feedback tool",              sig: "asked 'how to launch?'",          s: 69, hot: false },
];

function PlatformChip({ p }: { p: string }) {
  if (p === "x")  return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#1C1917] text-white"><XIcon /></span>;
  if (p === "li") return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#0a66c2] text-white"><LinkedInIcon /></span>;
  return              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#ff4500] text-white"><RedditIcon /></span>;
}

function DashboardMock() {
  return (
    <div className="text-left font-sans" style={{ color: "#1C1917" }}>
      {/* App chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-stone-50/40" style={{ borderColor: "#E7E5E4" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md text-white text-[12px] font-bold" style={{ background: "#FF5A4D" }}>F</div>
            <span className="text-[17px] font-semibold tracking-tight">Farcast</span>
          </div>
          <span className="text-stone-300">/</span>
          <span className="text-[13.5px] text-stone-600">bramble.dev</span>
        </div>
        <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg border bg-white" style={{ borderColor: "#E7E5E4" }}>
          {["today", "queue", "leads", "analytics"].map((t, i) => (
            <button key={t} className={`text-[12.5px] px-2.5 py-1 rounded-md capitalize ${i === 0 ? "bg-[#1C1917] text-white" : "text-stone-600 hover:text-[#1C1917]"}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-stone-500">Day 14 / 30</span>
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-300 to-stone-400 block" />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 divide-x" style={{ divideColor: "#E7E5E4" }}>
        {/* Drafts */}
        <div className="lg:col-span-7 bg-white p-5 lg:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[11px] tracking-wider uppercase text-stone-500">Today&apos;s drafts</div>
              <h4 className="text-[22px] font-semibold mt-1" style={{ letterSpacing: "-0.055em" }}>4 ready · approve to ship</h4>
            </div>
            <button className="text-[12.5px] font-mono text-stone-500 hover:text-[#1C1917] flex items-center gap-1.5">
              <SparkIcon /> Regenerate
            </button>
          </div>
          <div className="space-y-2.5">
            {DRAFTS.map((d, i) => (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: "#E7E5E4" }}>
                <div className="flex items-center gap-2 mb-2">
                  <PlatformChip p={d.p} />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">{d.tag}</span>
                  <span className="font-mono text-[11px] text-stone-400">· {d.len}</span>
                  <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "#FF5A4D" }}>
                    <span className="w-1 h-1 rounded-full bg-[#FF5A4D] block" /> intent {d.intent}
                  </span>
                </div>
                <h5 className="text-[14.5px] font-medium mb-1" style={{ letterSpacing: "-0.01em" }}>{d.title}</h5>
                <p className="text-[13px] text-stone-500 leading-[1.55] line-clamp-2">{d.body}</p>
                <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: "#E7E5E4" }}>
                  <button className="text-[12px] font-medium bg-[#1C1917] text-white px-2.5 py-1 rounded-md">Approve & post</button>
                  <button className="text-[12px] text-stone-600 px-2 py-1 rounded-md">Edit</button>
                  <button className="text-[12px] text-stone-500 px-2 py-1 rounded-md">Regenerate</button>
                  <span className="ml-auto font-mono text-[11px] text-stone-400">queued · 9:14am</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads */}
        <div className="lg:col-span-5 bg-white p-5 lg:p-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[11px] tracking-wider uppercase text-stone-500">Warm leads · scored natively</div>
              <h4 className="text-[22px] font-semibold mt-1" style={{ letterSpacing: "-0.055em" }}>12 in your zone</h4>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium" style={{ color: "#FF5A4D", borderColor: "rgba(255,90,77,0.2)", background: "rgba(255,90,77,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A4D] block" /> 3 hot
            </span>
          </div>
          <div className="rounded-xl border divide-y" style={{ borderColor: "#E7E5E4" }}>
            {LEADS.map((l, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate">{l.n}</span>
                    {l.hot && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium shrink-0" style={{ color: "#FF5A4D", borderColor: "rgba(255,90,77,0.2)", background: "rgba(255,90,77,0.08)" }}>
                        <span className="w-1 h-1 rounded-full bg-[#FF5A4D] block" />Hot
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-stone-500 truncate">{l.bio} · <span className="text-stone-400">{l.sig}</span></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[12px] text-stone-700">{l.s}</div>
                  <div className="font-mono text-[10px] text-stone-400">score</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Drafts shipped", "38", "this month"],
              ["Impressions", "412k", "+38% wow"],
              ["Reply rate", "11.4%", "vs 2.1% baseline"],
            ].map(([k, v, sub], i) => (
              <div key={i} className="rounded-lg border p-3" style={{ borderColor: "#E7E5E4" }}>
                <div className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{k}</div>
                <div className="text-[20px] font-semibold mt-1" style={{ letterSpacing: "-0.055em" }}>{v}</div>
                <div className="font-mono text-[10.5px] text-stone-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("https://your-saas.com");
  const [stage, setStage] = useState<"idle" | "running" | "done">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === "running") return;
    setStage("running");
    timers.current.forEach(clearTimeout);
    timers.current = [setTimeout(() => setStage("done"), 1400)];
    router.push(`/onboarding`);
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col">
      <div className="absolute inset-0 landing-grid-bg pointer-events-none" />

      {/* Upper half — eyebrow centered between nav and headline */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border bg-white shadow-sm" style={{ borderColor: "#E7E5E4" }}>
          <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full" style={{ background: "rgba(255,90,77,0.10)", color: "#FF5A4D" }}>
            <SparkIcon />
          </span>
          <span className="font-mono text-[11px] tracking-wider text-stone-700">HERMES AGENT v1.4</span>
          <span className="w-px h-3 bg-stone-200" />
          <span className="font-mono text-[11px] text-emerald-600 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" /> ONLINE
          </span>
        </div>
      </div>

      {/* Lower half — headline, subhead, form */}
      <div className="relative flex-1 w-full max-w-[920px] mx-auto px-6 pb-16 text-center">
        <h1 className="display-xl font-semibold leading-[0.92] text-[44px] sm:text-[60px] lg:text-[80px]" style={{ color: "#1C1917" }}>
          Building is easy.<br />
          <span className="text-stone-400">Distribution isn&apos;t.</span>
        </h1>

        <p className="mt-4 lg:mt-5 mx-auto max-w-[680px] text-[15px] lg:text-[17px] leading-[1.5] text-stone-600">
          The autonomous AI growth co-founder that maps your ICP, clones your voice, and drops ready-to-publish posts and warm leads into your dashboard every morning.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 mx-auto max-w-[640px]">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border bg-white" style={{ borderColor: "#E7E5E4", boxShadow: "0 1px 0 rgba(28,25,23,0.04), 0 8px 24px -12px rgba(28,25,23,0.18)" }}>
            <div className="pl-3 pr-1 text-stone-400 shrink-0"><GlobeIcon /></div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={(e) => { if (url === "https://your-saas.com") e.target.select(); }}
              className="flex-1 min-w-0 bg-transparent py-3 text-[15.5px] focus:outline-none"
              spellCheck="false"
              style={{ color: "#1C1917" }}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-white text-[14px] font-medium pl-4 pr-3.5 py-3 rounded-xl hover:brightness-95 transition shrink-0"
              style={{ backgroundColor: "#FF5A4D" }}
            >
              {stage === "running" ? "Reading site…" : stage === "done" ? "Playbook ready" : "Get Started"}
              <ArrowIcon />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[11.5px] text-stone-500">
            <span className="flex items-center gap-1.5"><LockIcon /> Free to start</span>
            <span className="text-stone-300">·</span>
            <span>No credit card required</span>
            <span className="text-stone-300">·</span>
            <span>First agent live in ~90s</span>
          </div>
        </form>
      </div>
    </section>
  );
}

// ─── Dashboard peek ───────────────────────────────────────────────────────────
function DashboardPeek() {
  return (
    <section className="relative">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="relative">
          <div
            className="rounded-t-2xl border-x border-t bg-white overflow-hidden peek-mask"
            style={{
              borderColor: "#E7E5E4",
              height: "min(72vh, 720px)",
              boxShadow: "0 -1px 0 rgba(255,255,255,0.6), 0 30px 60px -30px rgba(28,25,23,0.18)",
            }}
          >
            <DashboardMock />
          </div>
          {/* Floating CTA on the seam */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white text-[13px] font-medium pl-3.5 pr-3 py-2 rounded-full shadow-lg hover:bg-stone-800 transition-colors"
              style={{ backgroundColor: "#1C1917" }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF5A4D] pulse-dot" />
              See today&apos;s playbook
              <ArrowIcon size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: BotIcon,
    title: "Autonomous Hermes Agent",
    body: "Scrapes subreddits, clones your voice, and extracts the viral frameworks your competitors are quietly running.",
  },
  {
    Icon: ShieldIcon,
    title: "Hardcoded anti-ban",
    body: "Platform-safe velocity limits — 1 Reddit post/week, 90/10 value ratio, links never in the hook. Zero bans in 14 months.",
  },
  {
    Icon: ReplyIcon,
    title: '"Reply Guy" extension',
    body: "Ghostwrites contextual, upvote-optimised replies natively inside X and Reddit. Two-click Chrome install.",
  },
];

function Features() {
  return (
    <section className="relative">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10 pt-32 lg:pt-40 pb-4">
        <div className="grid md:grid-cols-3 divide-x bg-stone-200 border rounded-2xl overflow-hidden" style={{ borderColor: "#E7E5E4" }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="p-6 lg:p-7" style={{ background: "#FFFCF8" }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-[12px]" style={{ color: "#FF5A4D" }}>0{i + 1}</span>
                <span className="flex-1 h-px bg-stone-200" />
                <span className="w-8 h-8 rounded-md border flex items-center justify-center bg-white" style={{ borderColor: "#E7E5E4" }}>
                  <f.Icon />
                </span>
              </div>
              <h3 className="text-[20px] font-semibold leading-[1.15] mb-2" style={{ letterSpacing: "-0.02em", color: "#1C1917" }}>{f.title}</h3>
              <p className="text-[14px] text-stone-600 leading-[1.55]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── The Math ─────────────────────────────────────────────────────────────────
const MATH_ROWS: [string, string][] = [
  ["ICP research with DISC profiling",        "$1,500/mo"],
  ["Channel strategy across 27 platforms",    "$1,000/mo"],
  ["Weekly content — X, LinkedIn, Reddit",    "$2,000/mo"],
  ["Video content ideas (YT, Insta, TikTok)", "$1,500/mo"],
  ["Launch posts for 20+ platforms",          "$2,500 one-time"],
  ["Cold outreach sequences + DMs",           "$500/mo"],
  ["Warm lead sourcing (high intent)",        "$1,000/mo"],
];

function TheMath() {
  return (
    <section className="relative">
      <div className="max-w-[920px] mx-auto px-6 lg:px-10 pt-4 lg:pt-8 pb-4 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "#FF5A4D" }}>THE MATH</span>
        <h2 className="display-xl mt-3 text-[44px] sm:text-[60px] lg:text-[72px] font-semibold leading-[0.98]" style={{ color: "#1C1917" }}>
          A $7,500/month<br />
          agency, <span style={{ color: "#FF5A4D" }}>automated.</span>
        </h2>
        <p className="mt-6 mx-auto max-w-[560px] text-[16px] leading-[1.55] text-stone-600">
          Farcast replaces every job a growth team does for a fraction of the cost. Here&apos;s exactly what you&apos;re getting.
        </p>
      </div>

      <div className="max-w-[920px] mx-auto px-6 lg:px-10 mt-8">
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E7E5E4", boxShadow: "0 30px 60px -40px rgba(28,25,23,0.15)" }}>
          {/* Header */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr] px-6 py-3.5 text-[13.5px] font-medium text-white" style={{ backgroundColor: "#1C1917" }}>
            <span>What you need</span>
            <span className="text-center font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>Without Farcast</span>
            <span className="text-center font-normal" style={{ color: "rgba(255,255,255,0.55)" }}>With Farcast</span>
          </div>
          {/* Rows */}
          {MATH_ROWS.map(([k, v], i) => (
            <div key={i} className="grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-3.5 border-t" style={{ borderColor: "#E7E5E4" }}>
              <span className="text-[14px]" style={{ color: "#1C1917" }}>{k}</span>
              <span className="text-center text-[13.5px] text-stone-500">{v}</span>
              <span className="flex justify-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: "rgba(255,90,77,0.10)", color: "#FF5A4D" }}>
                  <CheckIcon />
                </span>
              </span>
            </div>
          ))}
          {/* Total row */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr] items-center px-6 py-4 border-t" style={{ borderColor: "#E7E5E4", background: "rgba(255,90,77,0.06)" }}>
            <span className="text-[14px] font-semibold" style={{ color: "#1C1917" }}>Every month</span>
            <span className="text-center text-[14px] text-stone-400 line-through">$7,500+</span>
            <span className="text-center text-[16px] font-semibold" style={{ color: "#FF5A4D" }}>$50</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PRICING_FEATURES: [string, string][] = [
  ["10 Growth Playbooks", "per month"],
  ["30 Content Days", "(150 regenerations)"],
  ["2,000 Post Replies", "per month"],
  ["2,000 Direct messages", "per month"],
  ["900 Warm Leads", "per month (30/day)"],
  ["Full Chrome Extension", "access included"],
];

function Pricing() {
  return (
    <section className="relative">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10 pt-12 pb-20">
        <div className="mx-auto max-w-[520px]">
          <div className="text-center mb-6">
            <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">One plan. The whole product.</span>
          </div>
          <div className="rounded-2xl border-2 bg-white p-7 relative" style={{ borderColor: "#1C1917" }}>
            <div className="absolute -top-3 left-7 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: "#1C1917" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A4D] block" /> Pro
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="display text-[64px] font-semibold leading-none" style={{ letterSpacing: "-0.045em", color: "#1C1917" }}>$50</span>
              <span className="text-stone-500 text-[14px]">/month</span>
              <span className="ml-auto font-mono text-[11px] text-stone-500">cancel anytime</span>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-2.5">
              {PRICING_FEATURES.map(([n, k], i) => (
                <li key={i} className="flex items-baseline gap-3 text-[13.5px]">
                  <CheckIcon size={13} />
                  <span className="font-mono text-stone-500 w-12 shrink-0 text-[11px]">{n.split(" ")[0]}</span>
                  <span className="text-stone-700">{n.split(" ").slice(1).join(" ")} {k}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <PricingCTA />
            </div>
            <p className="mt-3 font-mono text-[11px] text-stone-500 text-center">no card required · 7 days free · 2-click cancel</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function LandingPageV2() {
  return (
    <div className="ld-root" style={{ background: "#FFFCF8" }}>
      <LandingNav />
      <Hero />
      <DashboardPeek />
      <Features />
      <TheMath />
      <Pricing />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
}
