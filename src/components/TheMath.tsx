"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
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

export function TheMath() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { clipPath: "inset(100% 0% 0% 0%)", yPercent: 20 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          yPercent: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
        }
      );
      gsap.fromTo(
        tableRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: tableRef.current, start: "top 85%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#faf8f6]">
      <div className="max-w-4xl mx-auto px-6">
        <div ref={headingRef} className="text-center mb-14" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
          <span className="inline-block text-xs font-bold tracking-widest text-[#ff6b4e] uppercase mb-4">
            The math
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1a2e] leading-tight mb-4">
            A $5K/month agency,{" "}
            <em className="not-italic text-[#ff6b4e]">automated.</em>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Farcast replaces every job a growth team does for a fraction of the cost. Here&apos;s exactly what you&apos;re getting.
          </p>
        </div>

        <div ref={tableRef} className="rounded-2xl border border-gray-200 overflow-hidden shadow-xl shadow-gray-100 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[480px]">
            <thead>
              <tr className="bg-[#1a1a2e] text-white">
                <th className="text-left px-4 sm:px-6 py-3 sm:py-4 font-semibold">What you need</th>
                <th className="text-center px-3 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Without Farcast</th>
                <th className="text-center px-3 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">With Farcast</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[#1a1a2e]">{row.need}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-500 font-medium whitespace-nowrap">{row.without}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#ff6b4e]/10">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff6b4e]" strokeWidth={2.5} />
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#ff6b4e]/20 bg-[#ff6b4e]/5">
                <td className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-[#1a1a2e] text-sm sm:text-base">Every month</td>
                <td className="px-3 sm:px-6 py-4 sm:py-5 text-center font-bold text-gray-700 text-sm sm:text-base line-through whitespace-nowrap">$7,500+</td>
                <td className="px-3 sm:px-6 py-4 sm:py-5 text-center font-bold text-[#ff6b4e] text-sm sm:text-base">$19</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
