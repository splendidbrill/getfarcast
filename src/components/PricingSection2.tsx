"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Zap, Crown } from "lucide-react";
import { SignInModal } from "./SignInModal";
import { sendGAEvent } from "@next/third-parties/google";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const plans = [
  {
    name: "Starter", price: "$19", period: "/month",
    description: "Everything Farcast does, with limits built for solo founders.",
    icon: Zap,
    features: [
      "10 Playbooks per month", 
      "30 Content Days (150 regenerations) per month", 
      "2,000 Post Replies per month", 
      "2,000 DMs per month", 
      "900 Warm Leads per month (30/day)",
      "Export as PDF"
    ],
    cta: "Get Starter", highlighted: true, iconColor: "text-[#ff6b4e]", bgIcon: "bg-[#ff6b4e]/10",
  },
  // {
  //   name: "Enterprise", price: "Custom", period: "",
  //   description: "For teams that need custom limits, rollout support, and a tailored distribution system.",
  //   icon: Crown,
  //   features: ["Custom playbook volume and onboarding", "Multi-seat access for teams", "Tailored channel and outbound workflows", "Priority support and implementation help", "Enterprise-ready planning for larger GTM motions"],
  //   cta: "Contact Us", highlighted: false, iconColor: "text-purple-500", bgIcon: "bg-purple-50",
  // },
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
            Simple pricing for serious distribution.
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Choose Starter for self-serve growth, or talk to us for an enterprise setup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 items-stretch max-w-5xl mx-auto" style={{ perspective: "1200px" }}>
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const ref = i === 0 ? card1Ref : card2Ref;
            return (
              <div
                key={plan.name}
                ref={ref}
                className={`relative rounded-3xl transition-all duration-500 bg-white shadow-xl ${plan.highlighted ? "border-2 border-[#ff6b4e] shadow-[#ff6b4e]/10 lg:scale-105 z-10" : "border border-gray-100 shadow-black/5 hover:-translate-y-2 hover:shadow-black/10 hover:border-gray-200"}`}
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
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? "text-[#ff6b4e]" : "text-blue-500"}`} />
                        <span className="text-gray-600 font-medium leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer text-center ${plan.highlighted ? "bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white shadow-lg shadow-[#ff6b4e]/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ff6b4e]/30" : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"}`}
                    onClick={() => {
                      sendGAEvent("event", "buttonClicked", { value: `pricing_${plan.name.toLowerCase()}` });
                      if (plan.name === "Starter") { isLoggedIn ? (window.location.href = "/dashboard") : setIsModalOpen(true); }
                      else { window.location.href = "/contact"; }
                    }}
                  >
                    {plan.cta}
                  </button>
                  {plan.name === "Enterprise" && <p className="text-center text-xs font-semibold text-gray-400 mt-4">We&apos;ll get back to you with a tailored setup.</p>}
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
