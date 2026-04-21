"use client";

import { useEffect, useRef } from "react";
import { MessageSquare, Search, Layers, PenTool, Users, Send } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const steps = [
  { number: "01", icon: MessageSquare, title: "Tell us what you built", description: "Describe your product in a few sentences. What it does, who it's for, and your pricing model. That's all we need.", detail: "Takes less than 2 minutes", gradient: "from-blue-500 to-blue-400", bg: "bg-blue-500" },
  { number: "02", icon: Search, title: "AI maps your ICP", description: "Our AI analyzes your product and identifies your exact ideal customer profile with demographics, psychographics, buying triggers, and DISC profiling.", detail: "Agency-level analysis", gradient: "from-purple-500 to-purple-400", bg: "bg-purple-500" },
  { number: "03", icon: Layers, title: "Get your channel strategy", description: "We rank the top platforms where your ICP hangs out, with engagement benchmarks, algorithm insights, and what to avoid on each.", detail: "Reddit, LinkedIn & more", gradient: "from-emerald-500 to-emerald-400", bg: "bg-emerald-500" },
  { number: "04", icon: PenTool, title: "Content is generated", description: "Get ready-to-post content for each channel with platform-specific templates, hooks, and anti-AI-slop guardrails to sound genuinely human.", detail: "Human-sounding, ready-to-use", gradient: "from-[#ff6b4e] to-[#ff8c5a]", bg: "bg-[#ff6b4e]" },
  { number: "05", icon: Users, title: "Warm Leads", description: "We surface real people already talking about your problem across Reddit, LinkedIn, X, and other niche communities — so your first message never feels cold.", detail: "Niche-matched leads", gradient: "from-rose-500 to-rose-400", bg: "bg-rose-500" },
  { number: "06", icon: Send, title: "Launch your outreach", description: "A complete cold outreach sequence with email and DM templates personalized to your product. Just copy, paste, and start getting users.", detail: "Copy, paste, grow", gradient: "from-amber-500 to-amber-400", bg: "bg-amber-500" },
];

export function HowItWorks2() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current,
        { yPercent: 40, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: headingRef.current, start: "top 85%" } }
      );

      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      if (window.innerWidth < 768) return;

      const totalScrollWidth = track.scrollWidth - section.offsetWidth;

      gsap.to(track, {
        x: -totalScrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalScrollWidth + section.offsetWidth * 0.5}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative overflow-hidden bg-[#faf8f6]" style={{ height: "100svh" }}>
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col">
        <div ref={headingRef} className="pt-14 pb-6 px-4 sm:px-6 md:px-16 text-center flex-shrink-0" style={{ opacity: 0 }}>
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight leading-snug">
            From zero to growth playbook
            <span className="text-gray-400"> in under 5 minutes.</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">Scroll to explore each step →</p>
        </div>

        <div className="flex-1 flex items-center overflow-x-auto md:overflow-hidden px-4 sm:px-6 md:px-16 pb-6 md:pb-0">
          <div ref={trackRef} className="flex gap-4 sm:gap-6 flex-nowrap" style={{ willChange: "transform" }}>
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="flex-shrink-0 w-[78vw] sm:w-[380px] md:w-[460px] bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-500 group cursor-default"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-5xl font-extrabold text-gray-100 group-hover:text-gray-200 transition-colors select-none">{step.number}</span>
                  </div>
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white ${step.bg}`}>{step.detail}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#1a1a2e] mb-3 group-hover:text-[#ff6b4e] transition-colors duration-300">{step.title}</h3>
                  <p className="text-base text-gray-500 font-medium leading-relaxed">{step.description}</p>
                  <div className="mt-8 flex gap-1.5">
                    {steps.map((_, j) => (
                      <div key={j} className={`h-1 rounded-full transition-all duration-300 ${j === i ? `flex-1 bg-gradient-to-r ${step.gradient}` : "w-3 bg-gray-200"}`} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* End CTA card */}
            <div className="flex-shrink-0 w-[78vw] sm:w-[280px] md:w-[360px] bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Ready to grow?</h3>
                <p className="text-white/80 font-medium leading-relaxed text-sm">Your complete growth playbook is ready in under 5 minutes.</p>
              </div>
              <a href="/onboarding" className="mt-8 flex items-center justify-center gap-2 bg-white text-[#ff6b4e] font-bold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                Get Started Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
