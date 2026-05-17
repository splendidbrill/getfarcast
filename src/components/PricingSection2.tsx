"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Zap, Lock, Sparkles } from "lucide-react";
import { SignInModal } from "./SignInModal";
import { sendGAEvent } from "@next/third-parties/google";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type PlanFeature = { text: string; locked?: boolean };

const plans: {
  name: string; price: string; period: string; description: string;
  icon: React.ElementType; features: PlanFeature[];
  cta: string; highlighted: boolean; iconColor: string; bgIcon: string; footNote?: string;
}[] = [
  {
    name: "Free", price: "$0", period: "/month",
    description: "Prove the engine works. Hit your first \"Aha!\" moment before you pay a cent.",
    icon: Sparkles,
    features: [
      { text: "1 Growth Playbook per month" },
      { text: "30 Warm Leads per month" },
      { text: "10 Content Days (basic posts) per month" },
      { text: "50 Post Replies per month" },
      { text: "50 DMs per month" },
      { text: "3 Growth Hacks per month" },
      { text: "Hermes Agent", locked: true },
      { text: "Daily Blogs", locked: true },
    ],
    cta: "Start Free", highlighted: false, iconColor: "text-gray-500", bgIcon: "bg-gray-100",
  },
  {
    name: "Starter", price: "$39", period: "/month",
    description: "Everything Farcast does, with limits built for solo founders.",
    icon: Zap,
    features: [
      { text: "10 Playbooks per month" },
      { text: "30 Content Days (150 regenerations) per month" },
      { text: "2,000 Post Replies per month" },
      { text: "2,000 DMs per month" },
      { text: "900 Warm Leads per month (30/day)" },
      { text: "Hermes Agent + Rival Spying" },
      { text: "Daily Blogs" },
      { text: "Export as PDF" },
    ],
    cta: "Get Starter", highlighted: true, iconColor: "text-[#ff6b4e]", bgIcon: "bg-[#ff6b4e]/10",
    footNote: "No card required for the first 7 days.",
  },
];

export function PricingSection2() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s?.user));

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current,
        { yPercent: 40, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: headingRef.current, start: "top 85%" } }
      );
      gsap.fromTo(card1Ref.current,
        { yPercent: 50, autoAlpha: 0, rotateY: -5 },
        { yPercent: 0, autoAlpha: 1, rotateY: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: sectionRef.current, start: "top 70%" } }
      );
      gsap.fromTo(card2Ref.current,
        { yPercent: 50, autoAlpha: 0, rotateY: 5 },
        { yPercent: 0, autoAlpha: 1, rotateY: 0, duration: 1.2, ease: "expo.out", delay: 0.15, scrollTrigger: { trigger: sectionRef.current, start: "top 70%" } }
      );
    }, sectionRef);

    return () => { ctx.revert(); subscription.unsubscribe(); };
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="relative py-20 sm:py-36 overflow-hidden bg-white">
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px] animate-float-delayed pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div ref={headingRef} className="text-center mb-16" style={{ opacity: 0 }}>
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight mb-6">
            Simple Distribution System.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 items-stretch max-w-5xl mx-auto" style={{ perspective: "1200px" }}>
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const ref = i === 0 ? card1Ref : card2Ref;
            return (
              <div
                key={plan.name}
                ref={ref}
                className={`relative rounded-3xl transition-all duration-500 bg-white shadow-xl ${plan.highlighted ? "border-2 border-[#ff6b4e] shadow-[#ff6b4e]/10 lg:scale-105 z-10" : "border border-gray-100 shadow-black/5"}`}
                style={{ opacity: 0 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse-soft">Most Popular</span>
                  </div>
                )}
                <div className="p-8 relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl ${plan.bgIcon} flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1a1a2e]">{plan.name}</h3>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold text-[#1a1a2e] tracking-tight">{plan.price}</span>
                      <span className="text-gray-400 font-medium">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mt-3 leading-relaxed">{plan.description}</p>
                  </div>
                  <div className="h-px bg-gray-100 my-6" />
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3 text-sm">
                        {feature.locked ? (
                          <Lock className="w-4 h-4 shrink-0 text-gray-300 mt-0.5" />
                        ) : (
                          <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? "text-[#ff6b4e]" : "text-gray-400"}`} />
                        )}
                        <span className={`font-medium leading-tight ${feature.locked ? "text-gray-300" : "text-gray-600"}`}>
                          {feature.text}
                          {feature.locked && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">Locked</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer text-center ${plan.highlighted ? "bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white shadow-lg shadow-[#ff6b4e]/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ff6b4e]/30" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}`}
                    onClick={() => {
                      sendGAEvent("event", "buttonClicked", { value: `pricing_${plan.name.toLowerCase()}` });
                      if (plan.name === "Starter") {
                        isLoggedIn ? (window.location.href = "/checkout") : setIsModalOpen(true);
                      } else {
                        isLoggedIn ? (window.location.href = "/dashboard") : setIsModalOpen(true);
                      }
                    }}
                  >
                    {plan.cta}
                  </button>
                  {plan.footNote && <p className="text-center text-xs font-semibold text-gray-400 mt-4">{plan.footNote}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
