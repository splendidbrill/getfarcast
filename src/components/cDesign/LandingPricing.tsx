import { PricingCTA } from "./PricingCTA";

export function LandingPricing() {
  return (
    <section id="pricing" className="ld-section ld-pricing">
      <div className="ld-container">
        <div className="ld-section-head center">
          <span className="ld-section-eyebrow">Pricing · One Tier, No Maze</span>
          <h2 className="ld-section-title">Simple, Transparent Pricing</h2>
          <p className="ld-section-lede" style={{ margin: "0 auto" }}>Everything Farcast does, with limits built for small teams. No seat math, no upgrade nags, no annual lock-in.</p>
        </div>

        <div className="ld-pricing-card">
          <div className="ld-pc-inner">
            <span className="ld-pc-tier">Starter</span>
            <h3 className="ld-pc-name">For solo/small teams</h3>
            <p className="ld-pc-sub">Everything Farcast does, with limits built for solo/small teams. No hidden fees.</p>
            <div className="ld-pc-price">
              <span className="num">$19</span>
              <span className="per">/month</span>
            </div>
            <div className="ld-pc-divider"></div>
            <ul className="ld-pc-features">
              {[
                ["10 Growth Playbooks", "per month"],
                ["30 Content Days", "(150 regenerations) per month"],
                ["2,000 Post Replies", "per month"],
                ["2,000 DMs", "per month"],
                ["900 Warm Leads", "per month (30/day)"],
                ["Full access", "to the Chrome Extension"],
              ].map(([bold, rest]) => (
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
    </section>
  );
}
