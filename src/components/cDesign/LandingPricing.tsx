import { PricingCTA } from "./PricingCTA";
import { Lock } from "lucide-react";

const freePlanFeatures: { text: string; locked?: boolean }[] = [
  { text: "1 Growth Playbook per month" },
  { text: "30 Warm Leads per month" },
  { text: "10 Content Days (basic posts)" },
  { text: "50 Post Replies & DMs per month" },
  { text: "3 Growth Hacks per month" },
  { text: "Hermes Agent", locked: true },
  { text: "Daily Blogs", locked: true },
];

const paidPlanFeatures: [string, string][] = [
  ["10 Growth Playbooks", "per month"],
  ["30 Content Days", "(150 regenerations) per month"],
  ["2,000 Post Replies", "per month"],
  ["2,000 DMs", "per month"],
  ["900 Warm Leads", "per month (30/day)"],
  ["Hermes Agent", "+ Rival Spying"],
  ["Daily Blogs", "included"],
  ["Full access", "to the Chrome Extension"],
];

export function LandingPricing() {
  return (
    <section id="pricing" className="ld-section ld-pricing">
      <div className="ld-container">
        <div className="ld-section-head center">
          <span className="ld-section-eyebrow">Pricing · Start Free, Upgrade When Ready</span>
          <h2 className="ld-section-title">Simple, Transparent Pricing</h2>
          <p className="ld-section-lede" style={{ margin: "0 auto" }}>Start free and prove the value. Upgrade to unlock the full system when you&apos;re ready to scale.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
          {/* Free Plan */}
          <div className="ld-pricing-card" style={{ opacity: 1 }}>
            <div className="ld-pc-inner">
              <span className="ld-pc-tier">Free</span>
              <h3 className="ld-pc-name">Prove it first</h3>
              <p className="ld-pc-sub">Hit your first &ldquo;Aha!&rdquo; moment before you pay a cent.</p>
              <div className="ld-pc-price">
                <span className="num">$0</span>
                <span className="per">/month</span>
              </div>
              <div className="ld-pc-divider"></div>
              <ul className="ld-pc-features">
                {freePlanFeatures.map(({ text, locked }) => (
                  <li key={text} style={{ opacity: locked ? 0.4 : 1 }}>
                    <span className="tick" style={{ background: locked ? "transparent" : undefined, border: locked ? "1px solid #ccc" : undefined }}>
                      {locked
                        ? <Lock width={8} height={8} />
                        : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      }
                    </span>
                    <span style={{ color: locked ? "#aaa" : undefined }}>
                      <b>{text}</b>
                      {locked && <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", marginLeft: "6px", letterSpacing: "0.05em" }}>Locked</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <a href="/dashboard" className="ld-pc-cta" style={{ background: "#f3f4f6", color: "#374151", boxShadow: "none" }}>
                Start Free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <p className="ld-pc-foot">No credit card required.</p>
            </div>
          </div>

          {/* Starter Plan */}
          <div className="ld-pricing-card">
            <div className="ld-pc-inner">
              <span className="ld-pc-tier">Starter</span>
              <h3 className="ld-pc-name">For solo/small teams</h3>
              <p className="ld-pc-sub">Everything Farcast does, with limits built for solo/small teams. No hidden fees.</p>
              <div className="ld-pc-price">
                <span className="num">$39</span>
                <span className="per">/month</span>
              </div>
              <div className="ld-pc-divider"></div>
              <ul className="ld-pc-features">
                {paidPlanFeatures.map(([bold, rest]) => (
                  <li key={bold}>
                    <span className="tick">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span><b>{bold}</b> {rest}</span>
                  </li>
                ))}
              </ul>
              <PricingCTA />
              <p className="ld-pc-foot">No card required for the first 7 days.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
