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
    color: "text-brand-400",
    borderColor: "hover:border-brand-500/30",
    bgIcon: "bg-brand-500/10",
  },
  {
    icon: BarChart3,
    title: "Quantified Market Sizing",
    description:
      "Know exactly how many potential customers exist, where they are, and whether the trend is growing or shrinking.",
    color: "text-accent-400",
    borderColor: "hover:border-accent-500/30",
    bgIcon: "bg-accent-500/10",
  },
  {
    icon: Megaphone,
    title: "Channel Strategy Engine",
    description:
      "Top 5 channels ranked by fit with ROI estimates, accessibility assessments, algorithm insights, and best/worst practice examples.",
    color: "text-emerald-400",
    borderColor: "hover:border-emerald-500/30",
    bgIcon: "bg-emerald-500/10",
  },
  {
    icon: Heart,
    title: "Buying Trigger Analysis",
    description:
      "Understand what makes your ICP pull the trigger, what else they pay for, and the exact pain points they mention online.",
    color: "text-rose-400",
    borderColor: "hover:border-rose-500/30",
    bgIcon: "bg-rose-500/10",
  },
  {
    icon: Brain,
    title: "DISC Personality Mapping",
    description:
      "Crystal AI-style personality profiling for your entire audience segment. Know exactly how to communicate with them.",
    color: "text-amber-400",
    borderColor: "hover:border-amber-500/30",
    bgIcon: "bg-amber-500/10",
  },
  {
    icon: FileText,
    title: "Ready-to-Post Content",
    description:
      "Platform-specific templates with hooks, tone, and structure. Not generic AI slop, but content that sounds like a real human wrote it.",
    color: "text-cyan-400",
    borderColor: "hover:border-cyan-500/30",
    bgIcon: "bg-cyan-500/10",
  },
  {
    icon: Users,
    title: "Cold Outreach Sequences",
    description:
      "3 to 5 touch email and DM sequences personalized to your product. Tested frameworks that actually get replies.",
    color: "text-violet-400",
    borderColor: "hover:border-violet-500/30",
    bgIcon: "bg-violet-500/10",
  },
  {
    icon: Shield,
    title: "Anti-AI-Slop Guardrails",
    description:
      "No dashes, no 'delve', no over-explaining. Human-sounding content with readability targets tuned per channel.",
    color: "text-orange-400",
    borderColor: "hover:border-orange-500/30",
    bgIcon: "bg-orange-500/10",
  },
];

function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transform,
        transition: "transform 0.3s ease-out",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}

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
      className="relative py-28 sm:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-850 to-surface-900" />

      {/* Accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/3 rounded-full blur-[150px] animate-pulse-soft" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-accent-400 uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Everything you need to
            <br />
            <span className="text-gradient">go from zero to traction.</span>
          </h2>
          <p className="mt-4 text-surface-200/50 max-w-xl mx-auto">
            Not just marketing advice. A complete, actionable playbook tailored
            to your specific product and audience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <TiltCard
                key={feature.title}
                className={`glass-card spotlight-card rounded-2xl p-5 border border-white/5 ${feature.borderColor} hover:bg-white/[0.03] cursor-default group ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 80}ms` } as React.CSSProperties}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${feature.bgIcon} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                >
                  <Icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-gradient-brand transition-all">
                  {feature.title}
                </h3>
                <p className="text-xs text-surface-200/45 leading-relaxed">
                  {feature.description}
                </p>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
