"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, TrendingDown, Clock, HelpCircle } from "lucide-react";

const problems = [
  {
    icon: HelpCircle,
    title: "Don't know where to post",
    desc: "You built something great but have zero idea which platforms your audience actually uses.",
    color: "text-brand-400",
    bgColor: "bg-brand-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Content sounds generic",
    desc: "Every post you write feels off. It either sounds too sales-y or gets zero engagement.",
    color: "text-accent-400",
    bgColor: "bg-accent-500/10",
  },
  {
    icon: TrendingDown,
    title: "Zero traction after launch",
    desc: "You launched on Product Hunt, got 5 upvotes, and then... silence. No users, no feedback.",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Clock,
    title: "Weeks wasted on guesswork",
    desc: "You spent weeks trying different channels with no strategy. Time you should have spent building.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="relative py-28 sm:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-850 to-surface-900" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-3">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Building is the easy part now.
            <br />
            <span className="text-surface-200/50">
              Getting users is where founders fail.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.title}
                className={`glass-card glass-card-hover rounded-2xl p-6 transition-all duration-500 cursor-default ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${problem.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${problem.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1.5">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-surface-200/50 leading-relaxed">
                      {problem.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stat callout */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 glass-card rounded-full px-6 py-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gradient">90%</span>
            </div>
            <span className="text-sm text-surface-200/60">
              of startups fail due to distribution, not the product.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
