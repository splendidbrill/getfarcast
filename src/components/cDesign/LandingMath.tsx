"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const rows = [
  { need: "ICP research with DISC profiling", without: "$1,500/mo" },
  { need: "Channel strategy across 27 platforms", without: "$1,000/mo" },
  { need: "Weekly content — X, LinkedIn, Reddit", without: "$2,000/mo" },
  { need: "Video content ideas (YT, Insta, TikTok)", without: "$1,500/mo" },
  { need: "Launch posts for 20+ platforms", without: "$2,500 one-time" },
  { need: "Cold outreach sequences + DMs", without: "$500/mo" },
  { need: "Warm lead sourcing (high intent)", without: "$1,000/mo" },
];

export function LandingMath() {
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: headRef.current, start: "top 85%" } }
      );
      gsap.fromTo(
        tableRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: tableRef.current, start: "top 85%" } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="ld-section ld-math">
      <div className="ld-container-narrow">
        <div ref={headRef} className="ld-section-head center">
          <span className="ld-section-eyebrow">The Math</span>
          <h2 className="ld-section-title">A $7,500/month agency, <em style={{ fontStyle: "normal", color: "var(--coral)" }}>automated.</em></h2>
          <p className="ld-section-lede" style={{ margin: "0 auto" }}>Farcast replaces every job a growth team does for a fraction of the cost. Here&apos;s exactly what you&apos;re getting.</p>
        </div>

        <div ref={tableRef} className="ld-math-table-wrap">
          <table className="ld-math-table">
            <thead>
              <tr>
                <th>What you need</th>
                <th>Without Farcast</th>
                <th>With Farcast</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.need}</td>
                  <td>{row.without}</td>
                  <td>
                    <span className="ld-math-tick">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Every month</td>
                <td className="strike">$7,500+</td>
                <td className="highlight">$40</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
