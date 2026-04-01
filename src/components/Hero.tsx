"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const PARTICLE_COUNT = 30;

function Particles() {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 20,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-brand-500/30"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `particle ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty("--mouse-x", `${x}%`);
      hero.style.setProperty("--mouse-y", `${y}%`);
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    hero.addEventListener("mousemove", handleMouseMove);
    return () => hero.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid" />
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at var(--mouse-x, 50%) var(--mouse-y, 40%), rgba(51,120,255,0.1) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)",
        }}
      />

      {/* Particles */}
      <Particles />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-500/5 blur-[100px] animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px] animate-morph" />

      {/* Cursor glow */}
      <div
        className="pointer-events-none fixed w-64 h-64 rounded-full bg-brand-500/10 blur-[60px] transition-transform duration-100 z-0"
        style={{
          left: mousePos.x - 128,
          top: mousePos.y - 128,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8 animate-fade-in-up opacity-0">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse-soft" />
          <span className="text-xs font-medium text-surface-200/80 tracking-wide uppercase">
            Vibe Marketing for Founders
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 animate-fade-in-up-delay-1 opacity-0">
          Your product is built.
          <br />
          <span className="text-gradient">Now get users.</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-surface-200/60 leading-relaxed mb-10 animate-fade-in-up-delay-2 opacity-0">
          Tell GetFarcast what you built and it generates a complete growth 
          playbook in minutes. Know your ICP, the channels they hang out on, 
          and get ready-to-post content for each platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3 opacity-0">
          <Link
            href="#pricing"
            id="hero-cta-primary"
            className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold text-base hover:from-brand-400 hover:to-accent-400 transition-all duration-300 shadow-2xl shadow-brand-500/25 flex items-center gap-2 hover:scale-105 hover:shadow-brand-500/40"
          >
            Start Your Free 14-Day Trial
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#how-it-works"
            id="hero-cta-secondary"
            className="px-8 py-3.5 rounded-xl text-surface-200/80 font-medium text-base border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200 hover:scale-105"
          >
            See How It Works
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-16 flex items-center justify-center gap-8 animate-fade-in-up-delay-3 opacity-0">
          <div className="flex -space-x-2">
            {[
              "bg-brand-500",
              "bg-accent-500",
              "bg-emerald-500",
              "bg-brand-400",
              "bg-accent-400",
            ].map((color, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${color} border-2 border-surface-900 flex items-center justify-center text-[10px] font-bold text-white animate-bounce-slow`}
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Join early founders</p>
            <p className="text-xs text-surface-200/50">
              Building in public. Shipping fast.
            </p>
          </div>
        </div>

        {/* Dashboard preview mock */}
        <div className="mt-20 relative max-w-4xl mx-auto animate-scale-in opacity-0" style={{ animationDelay: "0.8s" }}>
          <div className="gradient-border rounded-2xl overflow-hidden glow-brand">
            <div className="glass-card rounded-2xl p-1">
              <div className="bg-surface-850 rounded-xl overflow-hidden">
                {/* Mock browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="max-w-sm mx-auto bg-surface-900/80 rounded-md px-3 py-1 text-xs text-surface-200/40 font-mono">
                      app.getfarcast.com/playbook
                    </div>
                  </div>
                </div>
                {/* Mock content */}
                <div className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* ICP Card */}
                    <div className="glass-card rounded-xl p-4 space-y-3 hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-brand-500/20 flex items-center justify-center">
                          <span className="text-brand-400 text-xs">👤</span>
                        </div>
                        <span className="text-xs font-semibold text-white">
                          Your ICP
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-white/5 rounded-full w-full" />
                        <div className="h-2 bg-white/5 rounded-full w-3/4" />
                        <div className="h-2 bg-brand-500/20 rounded-full w-1/2" />
                      </div>
                      <div className="text-[10px] text-surface-200/40">
                        Solo founders, 25-35, tech-savvy...
                      </div>
                    </div>
                    {/* Channel Card */}
                    <div className="glass-card rounded-xl p-4 space-y-3 hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-accent-500/20 flex items-center justify-center">
                          <span className="text-accent-400 text-xs">📡</span>
                        </div>
                        <span className="text-xs font-semibold text-white">
                          Top Channels
                        </span>
                      </div>
                      <div className="space-y-2">
                        {["Reddit", "LinkedIn", "Insta"].map((ch, i) => (
                          <div key={ch} className="flex items-center gap-2">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${90 - i * 20}%`,
                                background: `linear-gradient(90deg, rgba(51,120,255,${0.6 - i * 0.15}), rgba(139,92,246,${0.6 - i * 0.15}))`,
                              }}
                            />
                            <span className="text-[10px] text-surface-200/40 whitespace-nowrap">
                              {ch}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Content Card */}
                    <div className="glass-card rounded-xl p-4 space-y-3 hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                          <span className="text-emerald-400 text-xs">✍️</span>
                        </div>
                        <span className="text-xs font-semibold text-white">
                          Content Ready
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-emerald-500/20" />
                          <div className="h-2 bg-white/5 rounded-full flex-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-emerald-500/20" />
                          <div className="h-2 bg-white/5 rounded-full flex-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-emerald-500/10" />
                          <div className="h-2 bg-white/5 rounded-full flex-1" />
                        </div>
                      </div>
                      <div className="text-[10px] text-surface-200/40">
                        12 posts generated
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow underneath */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-brand-500/10 blur-[80px] rounded-full animate-pulse-soft" />
        </div>
      </div>
    </section>
  );
}
