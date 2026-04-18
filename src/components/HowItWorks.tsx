"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Search, Layers, PenTool, Users, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Tell us what you built",
    description:
      "Describe your product in a few sentences. What it does, who it's for, and your pricing model. That's all we need.",
    detail: "Takes less than 2 minutes",
    gradient: "from-blue-500 to-blue-400",
    shadowColor: "shadow-blue-500/20"
  },
  {
    number: "02",
    icon: Search,
    title: "AI maps your ICP",
    description:
      "Our AI analyzes your product and identifies your exact ideal customer profile with demographics, psychographics, buying triggers, and DISC profiling.",
    detail: "Agency-level analysis",
    gradient: "from-purple-500 to-purple-400",
    shadowColor: "shadow-purple-500/20"
  },
  {
    number: "03",
    icon: Layers,
    title: "Get your channel strategy",
    description:
      "We rank the top platforms where your ICP hangs out, with engagement benchmarks, algorithm insights, and what to avoid on each.",
    detail: "Reddit, LinkedIn, Instagram & more",
    gradient: "from-emerald-500 to-emerald-400",
    shadowColor: "shadow-emerald-500/20"
  },
  {
    number: "04",
    icon: PenTool,
    title: "Content is generated",
    description:
      "Get ready-to-post content for each channel with platform-specific templates, hooks, and anti-AI-slop guardrails to sound genuinely human.",
    detail: "Human-sounding, ready-to-use",
    gradient: "from-[#ff6b4e] to-[#ff8c5a]",
    shadowColor: "shadow-[#ff6b4e]/20"
  },
  {
    number: "05",
    icon: Users,
    title: "Warm Leads",
    description:
      "We surface real people already talking about your problem across Reddit, LinkedIn, X, and other niche communities. Every lead is contextual — someone who posted about the exact pain your product solves, so your first message never feels cold.",
    detail: "Niche-matched leads",
    gradient: "from-rose-500 to-rose-400",
    shadowColor: "shadow-rose-500/20"
  },
  {
    number: "06",
    icon: Send,
    title: "Launch your outreach",
    description:
      "A complete cold outreach sequence with email and DM templates personalized to your product. Just copy, paste, and start getting users.",
    detail: "Copy, paste, grow",
    gradient: "from-amber-500 to-amber-400",
    shadowColor: "shadow-amber-500/20"
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

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

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-28 sm:py-36 overflow-hidden bg-[#faf8f6]"
    >
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-24">
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight">
            From zero to growth playbook
            <br />
            <span className="text-gray-400">in under 5 minutes.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Animated connecting line */}
          <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-1 hidden md:block bg-gray-100 rounded-full">
            <div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-[#ff6b4e] to-amber-500 rounded-full transition-all duration-1000 ease-out"
              style={{
                height: isVisible ? "100%" : "0%",
                transitionDelay: "0.3s",
              }}
            />
          </div>

          <div className="space-y-10 md:space-y-12 pl-0 md:pl-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`relative flex gap-6 md:gap-10 transition-all duration-700 cursor-default group ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-12"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                  onMouseEnter={() => setActiveStep(i)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  {/* Step number / icon */}
                  <div className="shrink-0 relative z-10 hidden md:block">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg ${step.shadowColor} transition-transform duration-300 ${
                        activeStep === i ? "scale-110" : ""
                      }`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`bg-white rounded-3xl p-6 sm:p-8 flex-1 border transition-all duration-300 ${
                      activeStep === i
                        ? "border-[#ff6b4e]/30 shadow-xl shadow-[#ff6b4e]/5 -translate-y-1"
                        : "border-gray-100 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {/* Mobile Icon */}
                      <div
                        className={`md:hidden w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-md`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                          STEP {step.number}
                        </span>
                        <div className="h-px flex-1 bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md">
                          {step.detail}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className={`text-2xl font-bold text-[#1a1a2e] mb-3 transition-colors duration-300 ${
                      activeStep === i && step.number === "04" ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]" : ""
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-base text-gray-600 font-medium leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}