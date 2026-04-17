"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Flame, Sparkles, Target, Zap, Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faReddit, faTwitter, faYoutube, faTiktok, faInstagram, faThreads, faProductHunt, faDiscord, faSlack, faQuora, faDev, faGithub } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

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
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20"
    >
      {/* Subtle mathematical grid background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 78, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 78, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Warm peachy hero gradient */}
      <div
        className="absolute top-0 inset-x-0 h-full pointer-events-none transition-opacity duration-700"
        style={{
          background: "radial-gradient(ellipse 80% 60% at var(--mouse-x, 50%) var(--mouse-y, 30%), rgba(255,200,170,0.5) 0%, transparent 60%)",
        }}
      />

      {/* Floating abstract decorative blobls */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#ff6b4e]/5 blur-[100px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/5 blur-[80px] animate-float-delayed pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#ff6b4e]/20 shadow-sm mb-8 animate-fade-in-up opacity-0">
          <Sparkles className="w-3.5 h-3.5 text-[#ff6b4e] animate-pulse-soft" />
          <span className="text-xs font-bold text-[#1a1a2e] tracking-wide uppercase">
            Your always-on AI growth agent
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 animate-fade-in-up-delay-1 opacity-0 text-[#1a1a2e]">
          Building is easy.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]">
            Distribution isn't.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 font-medium leading-relaxed mb-10 animate-fade-in-up-delay-2 opacity-0">
          Describe your product. Farcast finds your ICP, maps where they live, builds your content engine, and starts sending you warm leads — automatically
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3 opacity-0">
          <Link
            href="/onboarding"
            id="hero-cta-primary"
            className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold text-lg hover:shadow-xl hover:shadow-[#ff6b4e]/20 transition-all duration-300 flex items-center gap-3 hover:-translate-y-1"
          >
            <Zap className="w-5 h-5 fill-white" />
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#how-it-works"
            id="hero-cta-secondary"
            className="px-8 py-4 rounded-xl text-gray-600 font-bold text-lg border-2 border-gray-200 hover:border-[#1a1a2e] hover:text-[#1a1a2e] hover:bg-black/5 transition-all duration-200"
          >
            See How It Works
          </Link>
        </div>

        {/* Social Proof - Logo Marquee */}
        <div
          className="mt-14 w-full max-w-4xl mx-auto animate-fade-in-up-delay-3 opacity-0"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)"
          }}
        >
          <div className="marquee-track">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 md:gap-16 pr-12 md:pr-20">
                {[
                  faLinkedin, faReddit, faTwitter, faYoutube, faTiktok, faInstagram,
                  faThreads, faProductHunt, faDiscord, faSlack, faQuora, faDev
                ].map((icon, idx) => (
                  <FontAwesomeIcon
                    key={idx}
                    icon={icon}
                    className="w-[44px] h-[44px] md:w-[56px] md:h-[56px] shrink-0 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  />
                ))}
                <FontAwesomeIcon
                  icon={faGithub}
                  className="w-[44px] h-[44px] md:w-[56px] md:h-[56px] shrink-0 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating Mock UI - Clean, White Gojiberry Style */}
        <div className="mt-20 relative max-w-4xl mx-auto animate-scale-in opacity-0" style={{ animationDelay: "0.8s" }}>

          {/* Decorative floating sub-cards outside the main frame */}
          <div className="absolute -left-12 top-10 w-48 bg-white rounded-2xl shadow-xl shadow-black/5 p-4 border border-gray-100 animate-float hidden lg:block z-20" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-gray-900">Found ICP</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full mb-1" />
            <div className="h-1.5 w-2/3 bg-gray-100 rounded-full" />
          </div>

          <div className="absolute -right-8 bottom-12 w-56 bg-white rounded-2xl shadow-xl shadow-black/5 p-4 border border-gray-100 animate-float-delayed hidden lg:block z-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <span className="text-[10px]">in</span>
                </div>
                <span className="text-xs font-bold text-gray-900">Post Drafted</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] text-gray-600 font-medium">"Here's exactly how we reduced our churn by 40%..."</p>
            </div>
          </div>

          {/* Main Mock App Window */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-[#ff6b4e]/10 border border-black/5 overflow-hidden relative z-10">
            {/* Mock browser bar */}
            <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 ml-4 flex justify-center">
                <div className="w-64 bg-white rounded-md px-3 py-1.5 text-xs text-gray-400 font-semibold text-center border border-gray-100 shadow-sm flex items-center justify-center gap-2">
                  <span className="w-3 h-3 text-gray-300">🔒</span>
                  app.getfarcast.com/playbook
                </div>
              </div>
            </div>

            {/* Mock content */}
            <div className="p-8 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Mock Card 1 */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-[#ff6b4e]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-[#1a1a2e]">Your Market</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-blue-200 rounded-full w-1/2" />
                  </div>
                </div>

                {/* Mock Card 2 */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-[#ff6b4e]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-bold text-[#1a1a2e]">Channels</span>
                  </div>
                  <div className="space-y-3">
                    {["Reddit", "X/Twitter", "Hacker News"].map((ch, i) => (
                      <div key={ch} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-500 w-16">{ch}</span>
                        <div className="h-2 rounded-full flex-1 bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-[#ff6b4e]"
                            style={{ width: `${100 - i * 20}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock Card 3 */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-[#ff6b4e]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#ff6b4e]/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#ff6b4e]" />
                    </div>
                    <span className="text-sm font-bold text-[#1a1a2e]">Content Output</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="h-2 bg-gray-200 rounded-full w-full mb-1" />
                      <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="h-2 bg-gray-200 rounded-full w-4/5 mb-1" />
                      <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                    </div>
                  </div>
                </div>

                {/* Mock Card 4 */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-[#ff6b4e]/30 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-sm font-bold text-[#1a1a2e]">Warm Leads</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Founder", width: "88%" },
                      { label: "PM", width: "72%" },
                      { label: "Marketer", width: "60%" },
                    ].map((lead) => (
                      <div key={lead.label} className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{lead.label}</span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Active
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#ff6b4e] transition-all duration-700"
                            style={{ width: lead.width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Glow underneath the mock app */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-black/10 blur-xl rounded-full z-0" />
        </div>
      </div>
    </section>
  );
}

// Icons for the floating cards that weren't imported yet
function Check(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
