"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Search, Layers, PenTool, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Tell us what you built",
    description:
      "Describe your product in a few sentences. What it does, who it's for, and your pricing model. That's all we need.",
    detail: "Takes less than 2 minutes",
    gradient: "from-brand-500 to-brand-400",
  },
  {
    number: "02",
    icon: Search,
    title: "AI maps your ICP",
    description:
      "Our AI analyzes your product and identifies your exact ideal customer profile with demographics, psychographics, buying triggers, and DISC personality mapping.",
    detail: "Powered by GPT-5.4",
    gradient: "from-brand-400 to-accent-500",
  },
  {
    number: "03",
    icon: Layers,
    title: "Get your channel strategy",
    description:
      "We rank the top platforms where your ICP hangs out, with engagement benchmarks, algorithm insights, best practices, and what to avoid on each.",
    detail: "Reddit, LinkedIn, Instagram & more",
    gradient: "from-accent-500 to-accent-400",
  },
  {
    number: "04",
    icon: PenTool,
    title: "Content is generated",
    description:
      "Get ready-to-post content for each channel with platform-specific templates, hooks, tone guidelines, and anti-AI-slop guardrails to sound genuinely human.",
    detail: "Human-sounding, not AI slop",
    gradient: "from-accent-400 to-emerald-500",
  },
  {
    number: "05",
    icon: Send,
    title: "Launch your outreach",
    description:
      "A complete cold outreach sequence with email and DM templates personalized to your product. Just copy, paste, and start getting users.",
    detail: "Copy, paste, grow",
    gradient: "from-emerald-500 to-emerald-400",
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
      className="relative py-28 sm:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid opacity-50" />
      
      {/* Animated background elements */}
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-brand-500/5 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-accent-500/5 rounded-full blur-[100px] animate-float-delayed" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            From zero to growth playbook
            <br />
            <span className="text-surface-200/50">in under 5 minutes.</span>
          </h2>
        </div>

        <div className="relative">
          {/* Animated connecting line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px hidden md:block">
            <div className="w-full h-full bg-gradient-to-b from-brand-500/30 via-accent-500/30 to-emerald-500/30" />
            <div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-brand-500 to-accent-500 transition-all duration-700 ease-out"
              style={{
                height: isVisible ? "100%" : "0%",
                transitionDelay: "0.3s",
              }}
            />
          </div>

          <div className="space-y-8 md:space-y-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`relative flex gap-6 md:gap-8 transition-all duration-700 cursor-pointer group ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-8"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                  onMouseEnter={() => setActiveStep(i)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  {/* Step number / icon */}
                  <div className="shrink-0 relative z-10">
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg transition-all duration-300 ${
                        activeStep === i ? "scale-110 shadow-xl" : ""
                      }`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`glass-card spotlight-card rounded-2xl p-5 sm:p-6 flex-1 transition-all duration-300 ${
                      activeStep === i
                        ? "border-brand-500/30 bg-white/[0.05] shadow-lg shadow-brand-500/10"
                        : "border-white/5"
                    }`}
                    style={{
                      "--mouse-x": "50%",
                      "--mouse-y": "50%",
                    } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-surface-200/30 tracking-wider">
                        STEP {step.number}
                      </span>
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-xs text-surface-200/30">
                        {step.detail}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 transition-colors duration-300 group-hover:text-gradient-brand">
                      {step.title}
                    </h3>
                    <p className="text-sm text-surface-200/50 leading-relaxed">
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
