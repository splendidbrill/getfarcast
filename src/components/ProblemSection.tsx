"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, TrendingDown, Clock, HelpCircle } from "lucide-react";

const problems = [
  {
    icon: HelpCircle,
    title: "Don't know where to post",
    desc: "You built something great but have zero idea which platforms your audience actually uses.",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    icon: AlertTriangle,
    title: "Content sounds generic",
    desc: "Every post you write feels off. It either sounds too sales-y or gets zero engagement.",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
  },
  {
    icon: TrendingDown,
    title: "Zero traction after launch",
    desc: "You launched on Product Hunt, got 5 upvotes, and then... silence. No users, no feedback.",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
  },
  {
    icon: Clock,
    title: "Weeks wasted on guesswork",
    desc: "You spent weeks trying different channels with no strategy. Time you should have spent building.",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
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
      className="relative py-28 sm:py-36 overflow-hidden bg-white"
    >
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Soft animated background blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff6b4e]/5 rounded-full blur-[120px] animate-pulse-soft pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-[#ff6b4e] uppercase tracking-widest mb-3">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a2e] tracking-tight">
            Building is the easy part now.
            <br />
            <span className="text-gray-400">
              Getting users is where founders fail.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            const isLeft = i % 2 === 0;
            return (
              <div
                key={problem.title}
                className="bg-white rounded-3xl p-8 cursor-default group hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5 border border-gray-100 transition-all duration-500"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? "translateX(0)"
                    : isLeft
                      ? "translateX(-50px)"
                      : "translateX(50px)",
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-14 h-14 rounded-2xl ${problem.bgColor} flex items-center justify-center shrink-0 border ${problem.borderColor} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}
                  >
                    <Icon className={`w-6 h-6 ${problem.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1a1a2e] mb-2 group-hover:text-[#ff6b4e] transition-colors">
                      {problem.title}
                    </h3>
                    <p className="text-base text-gray-500 font-medium leading-relaxed">
                      {problem.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stat callout */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-full px-8 py-4 hover:scale-105 transition-transform duration-300 shadow-sm group">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] animate-pulse-soft">99%</span>
            </div>
            <span className="text-base font-medium text-gray-600 transition-colors group-hover:text-[#1a1a2e]">
              of startups fail due to distribution, not the product.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
