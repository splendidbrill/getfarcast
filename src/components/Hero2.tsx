"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Flame, Sparkles, Target, Zap, Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkedin, faReddit, faTwitter, faYoutube, faTiktok, faInstagram,
  faThreads, faProductHunt, faDiscord, faSlack, faQuora, faDev, faGithub,
} from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SignInModal } from "./SignInModal";
import gsap from "gsap";

export function Hero2() {
  const heroRef = useRef<HTMLDivElement>(null);
  const row1TitleRef = useRef<HTMLDivElement>(null);
  const row1CaptionRef = useRef<HTMLDivElement>(null);
  const row2CaptionRef = useRef<HTMLDivElement>(null);
  const row2TitleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const mockRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      hero.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };
    hero.addEventListener("mousemove", handleMouseMove);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s?.user));

    // Entrance animation on mount
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(badgeRef.current, { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1 }, 0.2)
        .fromTo(row1TitleRef.current, { clipPath: "inset(100% 0% 0% 0%)", y: 40 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.2 }, 0.35)
        .fromTo(row1CaptionRef.current, { clipPath: "inset(100% 0% 0% 0%)", y: 30 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.2 }, 0.45)
        .fromTo(row2CaptionRef.current, { clipPath: "inset(100% 0% 0% 0%)", y: 30 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.2 }, 0.55)
        .fromTo(row2TitleRef.current, { clipPath: "inset(100% 0% 0% 0%)", y: 40 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.2 }, 0.65)
        .fromTo([subRef.current, ctaRef.current, marqueeRef.current], { yPercent: 30, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.15, duration: 1 }, 0.9)
        .fromTo(mediaRef.current, { clipPath: "inset(0% 0% 100% 0%)", scale: 0.96 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.4 }, 1.0)
        .fromTo(mockRef.current, { yPercent: 20, autoAlpha: 0, scale: 0.95 }, { yPercent: 0, autoAlpha: 1, scale: 1, duration: 1.2 }, 1.1);
    }, heroRef);

    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
      subscription.unsubscribe();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative overflow-hidden pt-16"
      style={{ minHeight: "100vh" }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,107,78,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,78,0.06) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      {/* Mouse gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at var(--mouse-x, 50%) var(--mouse-y, 30%), rgba(255,200,170,0.5) 0%, transparent 60%)" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#ff6b4e]/5 blur-[100px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/5 blur-[80px] animate-float-delayed pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-0">
        {/* Badge */}
        <div ref={badgeRef} className="flex justify-center mb-10" style={{ opacity: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#ff6b4e]/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#ff6b4e] animate-pulse-soft" />
            <span className="text-xs font-bold text-[#1a1a2e] tracking-wide uppercase">Your always-on AI growth agent</span>
          </div>
        </div>

        {/* Two-row headline layout (reference style) */}
        <div className="border-t border-black/10">
          <div className="flex justify-between items-end py-4 border-b border-black/10">
            <div ref={row1TitleRef} className="overflow-hidden" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
              <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-extrabold leading-none tracking-tight text-[#1a1a2e] uppercase">
                AI Growth
              </h1>
            </div>
            <div ref={row1CaptionRef} className="overflow-hidden text-right" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Always-On Engine</span>
            </div>
          </div>
          <div className="flex justify-between items-end py-4 border-b border-black/10">
            <div ref={row2CaptionRef} className="overflow-hidden" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">For Founders</span>
            </div>
            <div ref={row2TitleRef} className="overflow-hidden text-right" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
              <h1 className="text-[clamp(3.5rem,9vw,8rem)] font-extrabold leading-none tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]">
                Distribution
              </h1>
            </div>
          </div>
        </div>

        {/* Subheadline */}
        <p ref={subRef} className="max-w-2xl mx-auto text-center text-lg sm:text-xl text-gray-600 font-medium leading-relaxed mt-10" style={{ opacity: 0 }}>
          Describe your product. Farcast finds your ICP, maps where they live, builds your content engine, and starts sending you warm leads — automatically.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8" style={{ opacity: 0 }}>
          {isLoggedIn ? (
            <Link href="/dashboard" id="hero-cta-primary" className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold text-lg hover:shadow-xl hover:shadow-[#ff6b4e]/20 transition-all duration-300 flex items-center gap-3 hover:-translate-y-1">
              <Zap className="w-5 h-5 fill-white" />Start Your Free Trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button id="hero-cta-primary" onClick={() => setIsSignInOpen(true)} className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold text-lg hover:shadow-xl hover:shadow-[#ff6b4e]/20 transition-all duration-300 flex items-center gap-3 hover:-translate-y-1">
              <Zap className="w-5 h-5 fill-white" />Start Your Free Trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          )}
          <Link href="#how-it-works" id="hero-cta-secondary" className="px-8 py-4 rounded-xl text-gray-600 font-bold text-lg border-2 border-gray-200 hover:border-[#1a1a2e] hover:text-[#1a1a2e] hover:bg-black/5 transition-all duration-200">
            See How It Works
          </Link>
        </div>
        <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />

        {/* Marquee */}
        <div ref={marqueeRef} className="mt-14 w-full max-w-4xl mx-auto" style={{ opacity: 0, maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
          <div className="marquee-track">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 md:gap-16 pr-12 md:pr-20">
                {[faLinkedin, faReddit, faTwitter, faYoutube, faTiktok, faInstagram, faThreads, faProductHunt, faDiscord, faSlack, faQuora, faDev].map((icon, idx) => (
                  <FontAwesomeIcon key={idx} icon={icon} className="w-[44px] h-[44px] md:w-[56px] md:h-[56px] shrink-0 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                ))}
                <FontAwesomeIcon icon={faGithub} className="w-[44px] h-[44px] md:w-[56px] md:h-[56px] shrink-0 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero media */}
      <div ref={mediaRef} className="relative mt-16 w-full overflow-hidden" style={{ clipPath: "inset(0% 0% 100% 0%)" }}>
        <div ref={mockRef} className="max-w-5xl mx-auto px-6 pb-20" style={{ opacity: 0 }}>
          <div className="relative">
            {/* Floating cards */}
            <div className="absolute -left-12 top-10 w-48 bg-white rounded-2xl shadow-xl shadow-black/5 p-4 border border-gray-100 animate-float hidden lg:block z-20">
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
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center"><span className="text-[10px] font-bold">in</span></div>
                  <span className="text-xs font-bold text-gray-900">Post Drafted</span>
                </div>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-600 font-medium">&ldquo;Here&apos;s exactly how we reduced our churn by 40%...&rdquo;</p>
              </div>
            </div>

            {/* Main mock window */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-[#ff6b4e]/10 border border-black/5 overflow-hidden relative z-10">
              <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 ml-4 flex justify-center">
                  <div className="w-64 bg-white rounded-md px-3 py-1.5 text-xs text-gray-400 font-semibold text-center border border-gray-100 shadow-sm flex items-center justify-center gap-2">
                    <span className="w-3 h-3 text-gray-300">🔒</span>app.getfarcast.com/playbook
                  </div>
                </div>
              </div>
              <div className="p-8 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <MockCard icon={<Users className="w-4 h-4 text-blue-600" />} bg="bg-blue-100" title="Your Market">
                    <div className="space-y-3">
                      <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                      <div className="h-2.5 bg-gray-200 rounded-full w-3/4" />
                      <div className="h-2.5 bg-blue-200 rounded-full w-1/2" />
                    </div>
                  </MockCard>
                  <MockCard icon={<Zap className="w-4 h-4 text-purple-600" />} bg="bg-purple-100" title="Channels">
                    <div className="space-y-3">
                      {["Reddit", "X/Twitter", "Hacker News"].map((ch, i) => (
                        <div key={ch} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-500 w-16">{ch}</span>
                          <div className="h-2 rounded-full flex-1 bg-gray-200 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-[#ff6b4e]" style={{ width: `${100 - i * 20}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </MockCard>
                  <MockCard icon={<Sparkles className="w-4 h-4 text-[#ff6b4e]" />} bg="bg-[#ff6b4e]/10" title="Content Output">
                    <div className="space-y-2">
                      {[0, 1].map((i) => (
                        <div key={i} className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="h-2 bg-gray-200 rounded-full w-full mb-1" />
                          <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                        </div>
                      ))}
                    </div>
                  </MockCard>
                  <MockCard icon={<Flame className="w-4 h-4 text-amber-500" />} bg="bg-amber-100" title="Warm Leads">
                    <div className="space-y-2.5">
                      {[{ label: "Founder", width: "88%" }, { label: "PM", width: "72%" }, { label: "Marketer", width: "60%" }].map((lead) => (
                        <div key={lead.label} className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{lead.label}</span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Active
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-[#ff6b4e]" style={{ width: lead.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </MockCard>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-black/10 blur-xl rounded-full z-0" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockCard({ icon, bg, title, children }: { icon: React.ReactNode; bg: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-[#ff6b4e]/30 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        <span className="text-sm font-bold text-[#1a1a2e]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
