"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { SignInModal } from "./SignInModal";
import { sendGAEvent } from "@next/third-parties/google";

type Region = "global" | "india";
//new ssh key
const plans = {
  global: [
    {
      name: "Starter",
      price: "$20",
      period: "/month",
      description: "Perfect for solo founders testing a single product idea.",
      icon: Zap,
      features: [
        "1 product playbook",
        "ICP profiling with demographics",
        "Top 3 channel recommendations",
        "10 ready-to-post content pieces",
        "Basic cold outreach template",
        "Export as PDF",
      ],
      cta: "Start Free Trial",
      highlighted: false,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-500",
      bgIcon: "bg-blue-50",
    },
    {
      name: "Growth",
      price: "$99",
      period: "/month",
      description: "For serious founders ready to build a distribution engine.",
      icon: Sparkles,
      features: [
        "5 product playbooks",
        "Deep ICP with DISC personality mapping",
        "Full 5-channel strategy with algo insights",
        "50 content pieces with A/B variants",
        "Cold outreach sequences (email + DM)",
        "Buying trigger analysis",
        "Channel-specific templates",
        "Anti-AI-slop guardrails",
        "Priority AI processing",
      ],
      cta: "Start Free Trial",
      highlighted: true,
      gradient: "from-[#ff6b4e] to-[#ff8c5a]",
      iconColor: "text-[#ff6b4e]",
      bgIcon: "bg-[#ff6b4e]/10",
    },
    {
      name: "Scale",
      price: "$199",
      period: "/month",
      description: "For teams scaling distribution across multiple products.",
      icon: Crown,
      features: [
        "Unlimited playbooks",
        "Everything in Growth, plus:",
        "Team members (up to 5)",
        "Competitor analysis per channel",
        "Influencer identification for ICP",
        "Content calendar with scheduling",
        "Playbook version history",
        "Custom channel deep-dives",
        "Dedicated support",
      ],
      cta: "Start Free Trial",
      highlighted: false,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-500",
      bgIcon: "bg-purple-50",
    },
  ],
  india: [
    {
      name: "Starter",
      price: "₹999",
      period: "/month",
      description: "Perfect for solo founders testing a single product idea.",
      icon: Zap,
      features: [
        "1 product playbook",
        "ICP profiling with demographics",
        "Top 3 channel recommendations",
        "10 ready-to-post content pieces",
        "Basic cold outreach template",
        "Export as PDF",
      ],
      cta: "Start Free Trial",
      highlighted: false,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-500",
      bgIcon: "bg-blue-50",
    },
    {
      name: "Growth",
      price: "₹4,999",
      period: "/month",
      description: "For serious founders ready to build a distribution engine.",
      icon: Sparkles,
      features: [
        "5 product playbooks",
        "Deep ICP with DISC personality mapping",
        "Full 5-channel strategy with algo insights",
        "50 content pieces with A/B variants",
        "Cold outreach sequences (email + DM)",
        "Buying trigger analysis",
        "Channel-specific templates",
        "Anti-AI-slop guardrails",
        "Priority AI processing",
      ],
      cta: "Start Free Trial",
      highlighted: true,
      gradient: "from-[#ff6b4e] to-[#ff8c5a]",
      iconColor: "text-[#ff6b4e]",
      bgIcon: "bg-[#ff6b4e]/10",
    },
    {
      name: "Scale",
      price: "₹9,999",
      period: "/month",
      description: "For teams scaling distribution across multiple products.",
      icon: Crown,
      features: [
        "Unlimited playbooks",
        "Everything in Growth, plus:",
        "Team members (up to 5)",
        "Competitor analysis per channel",
        "Influencer identification for ICP",
        "Content calendar with scheduling",
        "Playbook version history",
        "Custom channel deep-dives",
        "Dedicated support",
      ],
      cta: "Start Free Trial",
      highlighted: false,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-500",
      bgIcon: "bg-purple-50",
    },
  ],
};

export function PricingSection() {
  const [region, setRegion] = useState<Region>("global");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const currentPlans = plans[region];

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-28 sm:py-36 overflow-hidden bg-white"
    >
      {/* Accent glow */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px] animate-float-delayed pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight mb-6">
            Start free. Scale when ready.
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Every plan starts with a 14-day free trial. No credit card required.
            Cancel anytime.
          </p>

          {/* Region toggle */}
          <div className="inline-flex items-center gap-1 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
            <button
              id="pricing-toggle-global"
              onClick={() => setRegion("global")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                region === "global"
                  ? "bg-white text-[#1a1a2e] shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-[#1a1a2e]"
              }`}
            >
              🌍 Global (USD)
            </button>
            <button
              id="pricing-toggle-india"
              onClick={() => setRegion("india")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                region === "india"
                  ? "bg-white text-[#1a1a2e] shadow-sm border border-gray-100"
                  : "text-gray-500 hover:text-[#1a1a2e]"
              }`}
            >
              🇮🇳 India (INR)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 items-center">
          {currentPlans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl transition-all duration-500 bg-white shadow-xl ${
                  plan.highlighted
                    ? "border-2 border-[#ff6b4e] shadow-[#ff6b4e]/10 lg:scale-105 z-10"
                    : "border border-gray-100 shadow-black/5 hover:-translate-y-2 hover:shadow-black/10 hover:border-gray-200"
                } ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse-soft">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 relative z-10 flex flex-col h-full">
                  {/* Plan header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl ${plan.bgIcon} flex items-center justify-center transition-transform duration-300 shadow-sm`}
                    >
                      <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#1a1a2e]">
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold text-[#1a1a2e] tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-gray-400 font-medium test-sm">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mt-3 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 my-6" />

                  {/* Features */}
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm transition-all duration-300"
                      >
                        <Check
                          className={`w-5 h-5 shrink-0 ${
                            plan.highlighted ? "text-[#ff6b4e]" : "text-blue-500"
                          }`}
                        />
                        <span className="text-gray-600 font-medium leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer text-center ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white shadow-lg shadow-[#ff6b4e]/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#ff6b4e]/30"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                    onClick={() => {
                      setIsModalOpen(true);
                      sendGAEvent('event', 'buttonClicked', { value: `pricing_trial_${plan.name.toLowerCase()}_${region}` });
                    }}
                  >
                    {plan.cta}
                  </button>

                  {/* Trial note */}
                  <p className="text-center text-xs font-semibold text-gray-400 mt-4">
                    14-day free trial included
                  </p>
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
