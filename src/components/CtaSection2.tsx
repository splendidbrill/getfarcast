"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function CtaSection2() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const signalsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        defaults: { ease: "expo.out" },
      });
      tl.fromTo(cardRef.current, { yPercent: 30, autoAlpha: 0, scale: 0.97 }, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 1.2 })
        .fromTo(iconRef.current, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.8, ease: "back.out(1.7)" }, 0.3)
        .fromTo(headingRef.current, { clipPath: "inset(100% 0% 0% 0%)", yPercent: 20 }, { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0, duration: 1 }, 0.5)
        .fromTo(subRef.current, { yPercent: 20, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8 }, 0.7)
        .fromTo(ctaRef.current, { yPercent: 20, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8 }, 0.85)
        .fromTo(signalsRef.current?.querySelectorAll(".signal-item") ?? [], { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6 }, 1.0);
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="cta" className="relative py-28 sm:py-36 overflow-hidden bg-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff6b4e]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div ref={cardRef} className="bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] rounded-3xl p-10 sm:p-20 text-center shadow-2xl shadow-[#ff6b4e]/20 relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-[50px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-[50px] pointer-events-none" />

          <div ref={iconRef} className="relative inline-flex mb-8" style={{ opacity: 0 }}>
            <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
            <div className="relative w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <Rocket className="w-7 h-7 text-[#ff6b4e]" />
            </div>
          </div>

          <h2 ref={headingRef} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight overflow-hidden" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
            Stop guessing.<br />Start growing.
          </h2>

          <p ref={subRef} className="max-w-2xl mx-auto text-lg text-white/90 font-medium leading-relaxed mb-10" style={{ opacity: 0 }}>
            You spent months building your product. Spend 5 minutes telling us about it and get a complete growth playbook that actually works.
          </p>

          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10" style={{ opacity: 0 }}>
            <Link href="/onboarding" id="cta-primary" className="group relative px-10 py-5 rounded-xl bg-white text-[#ff6b4e] font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl flex items-center gap-3 hover:-translate-y-1">
              Get Your Growth Playbook
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-6 text-sm font-semibold text-white/70">14-day free trial. No credit card required.</p>

          <div ref={signalsRef} className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {["AI-powered analysis", "Ready in minutes", "Human-sounding content", "Cancel anytime"].map((signal) => (
              <div key={signal} className="signal-item flex items-center gap-2" style={{ opacity: 0 }}>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{signal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
