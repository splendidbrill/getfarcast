"use client";

import { useEffect, useRef, useState } from "react";
import {
  Target,
  BarChart3,
  Users,
  Heart,
  FileText,
  Shield,
  Brain,
  Megaphone,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Laser-Precise ICP Profiling",
    description:
      "Job title, personality traits, age, income, location, DISC type. Not vague personas, but exact customer profiles you can act on.",
    color: "text-blue-500",
    borderColor: "hover:border-blue-200",
    bgIcon: "bg-blue-50",
    shadow: "hover:shadow-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Quantified Market Sizing",
    description:
      "Know exactly how many potential customers exist, where they are, and whether the trend is growing or shrinking.",
    color: "text-purple-500",
    borderColor: "hover:border-purple-200",
    bgIcon: "bg-purple-50",
    shadow: "hover:shadow-purple-500/10",
  },
  {
    icon: Megaphone,
    title: "Channel Strategy Engine",
    description:
      "Top 5 channels ranked by fit with ROI estimates, accessibility assessments, algorithm insights, and best/worst practice examples.",
    color: "text-emerald-500",
    borderColor: "hover:border-emerald-200",
    bgIcon: "bg-emerald-50",
    shadow: "hover:shadow-emerald-500/10",
  },
  {
    icon: Heart,
    title: "Buying Trigger Analysis",
    description:
      "Understand what makes your ICP pull the trigger, what else they pay for, and the exact pain points they mention online.",
    color: "text-rose-500",
    borderColor: "hover:border-rose-200",
    bgIcon: "bg-rose-50",
    shadow: "hover:shadow-rose-500/10",
  },
  {
    icon: Brain,
    title: "DISC Personality Mapping",
    description:
      "Crystal-style personality profiling for your entire audience segment. Know exactly how to communicate with them.",
    color: "text-amber-500",
    borderColor: "hover:border-amber-200",
    bgIcon: "bg-amber-50",
    shadow: "hover:shadow-amber-500/10",
  },
  {
    icon: FileText,
    title: "Ready-to-Post Content",
    description:
      "Platform-specific templates with hooks, tone, and structure. Not generic AI slop, but content that sounds like a real human wrote it.",
    color: "text-cyan-500",
    borderColor: "hover:border-cyan-200",
    bgIcon: "bg-cyan-50",
    shadow: "hover:shadow-cyan-500/10",
  },
  {
    icon: Users,
    title: "Cold Outreach Sequences",
    description:
      "3 to 5 touch email and DM sequences personalized to your product. Tested frameworks that actually get replies.",
    color: "text-[#ff6b4e]",
    borderColor: "hover:border-[#ff6b4e]/30",
    bgIcon: "bg-[#ff6b4e]/10",
    shadow: "hover:shadow-[#ff6b4e]/10",
  },
  {
    icon: Shield,
    title: "Anti-AI-Slop Guardrails",
    description:
      "No dashes, no 'delve', no over-explaining. Human-sounding content with readability targets tuned per channel.",
    color: "text-orange-500",
    borderColor: "hover:border-orange-200",
    bgIcon: "bg-orange-50",
    shadow: "hover:shadow-orange-500/10",
  },
];

export function FeaturesGrid() {
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

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-28 sm:py-36 overflow-hidden bg-white"
    >
      {/* Accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] animate-pulse-soft pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-purple-500 uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight">
            Everything you need to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
              go from zero to traction.
            </span>
          </h2>
          <p className="mt-6 text-gray-500 font-medium max-w-xl mx-auto text-lg leading-relaxed">
            Not just marketing advice. A complete, actionable playbook tailored
            to your specific product and audience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`bg-white rounded-3xl p-6 border border-gray-100 ${feature.borderColor} hover:-translate-y-1 cursor-default group transition-all duration-300 shadow-sm ${feature.shadow} ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${feature.bgIcon} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm`}
                >
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-base font-bold text-[#1a1a2e] mb-2 leading-snug group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
