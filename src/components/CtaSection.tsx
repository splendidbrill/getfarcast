"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="relative py-28 sm:py-36 overflow-hidden bg-white"
    >
      {/* Massive Gradient Background behind CTA container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff6b4e]/10 rounded-full blur-[150px] pointer-events-none" />

      <div
        className={`relative z-10 max-w-5xl mx-auto px-6 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] rounded-3xl p-10 sm:p-20 text-center shadow-2xl shadow-[#ff6b4e]/20 relative overflow-hidden">
          
          {/* Decorative faint patterns inside card */}
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-[50px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-[50px] pointer-events-none" />

          {/* Icon with pulse rings */}
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }} />
            
            <div className="relative w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <Rocket className="w-7 h-7 text-[#ff6b4e]" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Stop guessing.
            <br />
            Start growing.
          </h2>

          <p className="max-w-2xl mx-auto text-lg text-white/90 font-medium leading-relaxed mb-10">
            You spent months building your product. Spend 5 minutes telling us
            about it and get a complete growth playbook that actually works.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              href="#pricing"
              id="cta-primary"
              className="group relative px-10 py-5 rounded-xl bg-white text-[#ff6b4e] font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl flex items-center gap-3 hover:-translate-y-1"
            >
              Get Your Growth Playbook
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-6 text-sm font-semibold text-white/70">
            14-day free trial. No credit card required.
          </p>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            {[
              "AI-powered analysis",
              "Ready in minutes",
              "Human-sounding content",
              "Cancel anytime",
            ].map((signal, idx) => (
              <div
                key={signal}
                className="flex items-center gap-2"
                style={{
                  transitionDelay: `${idx * 100}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(10px)",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
                  {signal}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
