"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignInModal } from "@/components/SignInModal";

const PHRASES = [
  'Honestly, batching helps but the bigger unlock for me was a daily checklist that picks the threads worth replying to. Saves the "what do I even say" tax',
  "Same boat last year. The fix that actually stuck was building a tiny daily list of 3 conversations to join — not \"post more\". Quality of comments compounds way faster than volume",
  "Agree on the 2hr drain. What worked: pick 5 accounts you want to be in conversation with, reply to them by 9am, close the tab. The rest is theater",
];

export function LandingHero() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const typedRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    stopRef.current = false;
    const el = typedRef.current;
    if (!el) return;
    let i = 0;

    function step() {
      if (stopRef.current) return;
      const text = PHRASES[i];
      el!.innerHTML = "";
      let pos = 0;
      function tick() {
        if (stopRef.current) return;
        pos++;
        el!.innerHTML = text.slice(0, pos) + '<span class="ld-typing-cursor"></span>';
        if (pos < text.length) {
          setTimeout(tick, 18 + Math.random() * 22);
        } else {
          setTimeout(() => {
            i = (i + 1) % PHRASES.length;
            step();
          }, 3500);
        }
      }
      tick();
    }
    step();
    return () => { stopRef.current = true; };
  }, []);

  return (
    <>
    <header className="ld-hero">
      <div className="ld-container ld-hero-grid">
        <div>
          <span className="ld-eyebrow">
            <span className="dot"></span>
            <span>AI Growth Co-Founder · built for micro SaaS teams</span>
          </span>
          <h1 className="ld-hero-title">
            Our agents do the{" "}
            <em>growth thinking.</em>
            <br />You do the shipping.
          </h1>
          <p className="ld-hero-sub">
            Stop staring at a blank screen. Farcast is the AI Growth co-founder that finds your ICP, handles your daily growth execution on Reddit, X and Linkedin and ghostwrites your replies for engagement natively in your browser.
          </p>
          <div className="ld-cta-row">
            <button
              className="ld-btn-primary"
              onClick={() => isLoggedIn ? router.push("/dashboard") : setLoginOpen(true)}
            >
              {isLoggedIn ? "Go To Dashboard" : "Start your 7-day free trial"}
              <svg className="arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="ld-sub-link">Still at Zero Users? <a href="#">Click here for a free 1-month builder&apos;s pass.</a></span>
          </div>
          {/* <div className="ld-trust-row">
            <div className="ld-avatars">
              <span className="av">F</span>
              <span className="av">L</span>
              <span className="av">W</span>
              <span className="av">P</span>
            </div>
            <span>Trusted by indie founders</span>
          </div> */}
        </div>

        <div className="ld-hero-visual" aria-hidden="true">
          <div className="ld-dashboard-card">
            <div className="ld-db-topbar">
              <span className="ld-db-dot"></span>
              <span className="ld-db-dot"></span>
              <span className="ld-db-dot"></span>
              <span className="ld-db-url">app.farcast.com / today</span>
            </div>
            <div className="ld-db-body">
              <aside className="ld-db-side">
                <div className="brand-row"><span className="mark">F</span><span>Farcast</span></div>
                <div className="ld-db-section-label">Workspace</div>
                <div className="nav-item active">
                  <span className="ld-glyph">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="2.5" rx=".5" fill="currentColor"/><rect x="2" y="7" width="9" height="2.5" rx=".5" fill="currentColor"/><rect x="2" y="11" width="6" height="2.5" rx=".5" fill="currentColor"/></svg>
                  </span>
                  Today
                </div>
                <div className="nav-item">
                  <span className="ld-glyph">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
                  </span>
                  ICP
                </div>
                <div className="nav-item">
                  <span className="ld-glyph">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 13l3-4 3 2 5-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  Market
                </div>
                <div className="nav-item">
                  <span className="ld-glyph">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </span>
                  Playbooks
                </div>
                <div className="nav-item">
                  <span className="ld-glyph">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 13c0-2 2-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 8a2 2 0 100-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  </span>
                  Leads
                </div>
              </aside>
              <main className="ld-db-main">
                <div className="ld-db-h-row">
                  <div className="ld-db-h">Today&apos;s Playbook<span className="date">· Wed, May 7</span></div>
                  <span className="ld-db-pill">7 tasks ready</span>
                </div>
                <div className="ld-checklist">
                  <div className="ld-check-item done">
                    <span className="ld-check-box"></span>
                    <span className="ld-check-text">Reply to <strong>r/SaaS</strong> thread on cold email tools</span>
                    <span className="ld-check-tag r">Reddit</span>
                  </div>
                  <div className="ld-check-item">
                    <span className="ld-check-box"></span>
                    <span className="ld-check-text">Post: &quot;I shipped 3 tools this month — here&apos;s what worked&quot;</span>
                    <span className="ld-check-tag x">X</span>
                  </div>
                  <div className="ld-check-item">
                    <span className="ld-check-box"></span>
                    <span className="ld-check-text">DM 4 warm leads tagged &quot;indie B2B founder&quot;</span>
                    <span className="ld-check-tag li">DM</span>
                  </div>
                  <div className="ld-check-item">
                    <span className="ld-check-box"></span>
                    <span className="ld-check-text">Comment on @swyx thread re: dev marketing</span>
                    <span className="ld-check-tag x">X</span>
                  </div>
                </div>
                <div className="ld-db-stats">
                  <div className="ld-stat-card"><div className="lbl">New leads</div><div className="val">42<span className="delta">+18</span></div></div>
                  <div className="ld-stat-card"><div className="lbl">Replies sent</div><div className="val">17<span className="delta">+9</span></div></div>
                  <div className="ld-stat-card"><div className="lbl">Profile views</div><div className="val">1.2k<span className="delta">+340</span></div></div>
                </div>
              </main>
            </div>
          </div>

          <div className="ld-ext-card">
            <div className="ld-ext-header">
              <span className="ext-mark">F</span>
              <span className="ext-title">Reply Ghostwriter</span>
              <span className="ext-sub">⌘ + K</span>
            </div>
            <div className="ld-ext-source">
              <div className="ld-ext-src-row">
                <span className="platform">𝕏</span>
                <span><strong style={{ color: "var(--ink-2)" }}>@buildwithjake</strong> · 2h</span>
              </div>
              <p className="ld-ext-quote">&quot;What&apos;s the actual workflow people use to stay consistent on X without losing 2 hours a day?&quot;</p>
            </div>
            <div className="ld-ext-reply">
              <div className="ld-ext-reply-label">Drafted reply · Tone: Founder</div>
              <div className="ld-ext-reply-body" ref={typedRef}></div>
            </div>
            <div className="ld-ext-footer">
              <span className="ld-ext-tone active">Founder</span>
              <span className="ld-ext-tone">Witty</span>
              <span className="ld-ext-tone">Direct</span>
              <span className="ld-ext-send">Insert</span>
            </div>
          </div>
        </div>
      </div>
    </header>

      <SignInModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
