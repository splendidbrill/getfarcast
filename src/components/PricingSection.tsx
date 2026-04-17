"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Zap, Crown } from "lucide-react";
import { SignInModal } from "./SignInModal";
import { sendGAEvent } from "@next/third-parties/google";
import { createClient } from "@/lib/supabase/client";

const plans = [
  {
    name: "Starter",
    price: "$10",
    period: "/month",
    description: "Everything Farcast does, up to 10 playbooks.",
    icon: Zap,
    features: [
      "14-day free trial",
      "Full ICP profile for your product — demographics, psychographics, buying signals",
      "Ranked channel strategy across 27 platforms — where your buyers actually are",
      "Platform-native content across every recommended channel — ready to post",
      "Cold outreach sequences — email and DM templates for your specific ICP",
      "30-day action plan — what to do, where, and in what order",
      "Export as PDF",
    ],
    cta: "Get Starter",
    highlighted: true,
    iconColor: "text-[#ff6b4e]",
    bgIcon: "bg-[#ff6b4e]/10",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams that need custom limits, rollout support, and a tailored distribution system.",
    icon: Crown,
    features: [
      "Custom playbook volume and onboarding",
      "Multi-seat access for teams",
      "Tailored channel and outbound workflows",
      "Priority support and implementation help",
      "Enterprise-ready planning for larger GTM motions",
    ],
    cta: "Contact Us",
    highlighted: false,
    iconColor: "text-purple-500",
    bgIcon: "bg-purple-50",
  },
];

export function PricingSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      observer.disconnect();
      subscription.unsubscribe();
    };
  }, []);

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
            Simple pricing for serious distribution.
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Choose Starter for self-serve growth, or talk to us for an enterprise setup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, i) => {
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
                      sendGAEvent('event', 'buttonClicked', { value: `pricing_${plan.name.toLowerCase()}` });
                      
                      if (plan.name === "Starter") {
                        if (isLoggedIn) {
                          window.location.href = "/api/checkout/starter";
                        } else {
                          setNextUrl("/api/checkout/starter");
                          setIsModalOpen(true);
                        }
                      } else {
                        window.location.href = "/contact";
                      }
                    }}
                  >
                    {plan.cta}
                  </button>

                  {plan.name === "Enterprise" && (
                    <p className="text-center text-xs font-semibold text-gray-400 mt-4">
                      We&apos;ll get back to you with a tailored setup.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} nextUrl={nextUrl} />
    </section>
  );
}
