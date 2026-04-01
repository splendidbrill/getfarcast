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
      className="relative py-28 sm:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Large gradient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/8 rounded-full blur-[150px]" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent-500/6 rounded-full blur-[100px] animate-float" />

      <div
        className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-8 shadow-2xl shadow-brand-500/20">
          <Rocket className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
          Stop guessing.
          <br />
          <span className="text-gradient">Start growing.</span>
        </h2>

        <p className="max-w-xl mx-auto text-lg text-surface-200/50 leading-relaxed mb-10">
          You spent months building your product. Spend 5 minutes telling us
          about it and get a complete growth playbook that actually works.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#pricing"
            id="cta-primary"
            className="group relative px-10 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-bold text-base hover:from-brand-400 hover:to-accent-400 transition-all duration-300 shadow-2xl shadow-brand-500/25 flex items-center gap-2"
          >
            Get Your Growth Playbook
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <p className="mt-5 text-sm text-surface-200/30">
          14-day free trial. No credit card required.
        </p>

        {/* Trust signals */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {[
            "AI-powered analysis",
            "Ready in minutes",
            "Human-sounding content",
            "Cancel anytime",
          ].map((signal) => (
            <div key={signal} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-surface-200/40 font-medium">
                {signal}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
