"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Sparkles, Zap, Crown } from "lucide-react";

type Region = "global" | "india";

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
      gradient: "from-surface-700 to-surface-800",
      borderColor: "border-white/5",
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
      gradient: "from-brand-600 to-accent-600",
      borderColor: "border-brand-500/30",
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
      gradient: "from-surface-700 to-surface-800",
      borderColor: "border-white/5",
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
      gradient: "from-surface-700 to-surface-800",
      borderColor: "border-white/5",
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
      gradient: "from-brand-600 to-accent-600",
      borderColor: "border-brand-500/30",
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
      gradient: "from-surface-700 to-surface-800",
      borderColor: "border-white/5",
    },
  ],
};

export function PricingSection() {
  const [region, setRegion] = useState<Region>("global");
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
      className="relative py-28 sm:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-850 to-surface-900" />

      {/* Accent glow */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-accent-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Start free. Scale when ready.
          </h2>
          <p className="text-surface-200/50 max-w-lg mx-auto mb-8">
            Every plan starts with a 14-day free trial. No credit card required.
            Cancel anytime.
          </p>

          {/* Region toggle */}
          <div className="inline-flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
            <button
              id="pricing-toggle-global"
              onClick={() => setRegion("global")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                region === "global"
                  ? "pricing-toggle-active text-white shadow-lg"
                  : "text-surface-200/50 hover:text-white"
              }`}
            >
              🌍 Global (USD)
            </button>
            <button
              id="pricing-toggle-india"
              onClick={() => setRegion("india")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                region === "india"
                  ? "pricing-toggle-active text-white shadow-lg"
                  : "text-surface-200/50 hover:text-white"
              }`}
            >
              🇮🇳 India (INR)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
          {currentPlans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl transition-all duration-700 ${
                  plan.highlighted
                    ? "glass-card border-2 border-brand-500/30 glow-brand scale-[1.02] lg:scale-105"
                    : "glass-card border border-white/5"
                } ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white">
                        {plan.price}
                      </span>
                      <span className="text-surface-200/40 text-sm">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-surface-200/40 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/5 my-5" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <Check
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            plan.highlighted
                              ? "text-brand-400"
                              : "text-surface-200/30"
                          }`}
                        />
                        <span className="text-surface-200/70">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:from-brand-400 hover:to-accent-400 shadow-lg shadow-brand-500/20"
                        : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Trial note */}
                  <p className="text-center text-xs text-surface-200/30 mt-3">
                    14-day free trial included
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
