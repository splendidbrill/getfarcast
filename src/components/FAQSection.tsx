"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const faqs = [
  {
    q: "What do Farcast Growth Agents actually do for my business?",
    a: "Think of a Growth Agent as a digital GTM team that never sleeps. It handles the manual heavy lifting of founder-led growth: identifying your ICP, sourcing high-intent leads, and distributing tailored content across your socials to keep your pipeline full while you focus on building.",
  },
  {
    q: "How do the Growth Agents analyze my target customers?",
    a: "We don't just scrape a website link and guess. Our agents are trained on the same strategic frameworks used by top-tier growth agencies. They act like a consultant: asking deep, relevant questions about your business to understand your unique value. Agents then apply structured frameworks to identify your true ICP, determine exactly where they \"hang out\" online, and pinpoint the specific buying triggers that lead to conversions.",
  },
  {
    q: 'How does the "Reply Guy" feature work?',
    a: "To grow from scratch, you have to be active in the comments — that's how people discover you. Our Chrome extension handles the heavy lifting by generating context-aware, high-value replies for LinkedIn, X, and Reddit. It thinks of the perfect response for you so you can build authority and drive traffic back to your app without wasting hours staring at a blank text box.",
  },
  {
    q: "Which platforms are supported?",
    a: "Farcast offers the widest distribution range for founders. Text-Based Growth: LinkedIn, X (Twitter), and Reddit. Video Strategy: AI-generated ideas and hooks for Instagram, TikTok, and YouTube. Launch Platforms: Native, ready-to-post content for 25+ platforms including Product Hunt and Indie Hackers. Coming Soon: Discord, Slack, and Pinterest integrations.",
  },
  {
    q: "Does the agent post content automatically?",
    a: 'Not yet, but "Full Autopilot" is coming soon. Currently, our agents generate "Ready-to-Post" content that is so well-polished it requires minimal review. This ensures you maintain 100% control over your brand voice while still benefiting from AI-driven speed.',
  },
  {
    q: "How many leads will I get per day and from which channels?",
    a: "With our Starter Pack, you'll receive 30 high-intent leads per day. These leads are sourced from LinkedIn, Reddit, and X, ensuring you are reaching potential customers talking about the pain points your app is solving actively.",
  },
  {
    q: "How long until I see results?",
    a: "You'll see your first batch of analyzed leads and drafted content within 10 minutes of setting up your agent. Most founders report a significant increase in profile views and inbound inquiries within the first 14 days of consistent agent activity.",
  },
  {
    q: "What is your refund policy?",
    a: "We want you to be 100% happy with Farcast. If your free trial ends and a subscription is triggered, but you decide you don't want to continue, we've got you covered. Just send a quick note to hello@getfarcast.com and we will refund your payment.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(
      itemRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "expo.out",
        delay: index * 0.06,
        scrollTrigger: { trigger: itemRef.current, start: "top 90%" },
      }
    );
  }, [index]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (open) {
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in" });
    }
  }, [open]);

  return (
    <div ref={itemRef} className="border-b border-[#1a1a2e]/10 opacity-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base md:text-lg font-semibold text-[#1a1a2e] group-hover:text-[#ff6b4e] transition-colors duration-200">
          {q}
        </span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full border border-[#1a1a2e]/20 flex items-center justify-center text-[#1a1a2e] group-hover:border-[#ff6b4e] group-hover:text-[#ff6b4e] transition-colors duration-200">
          {open ? <Minus size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
        </span>
      </button>
      <div ref={bodyRef} style={{ height: 0, overflow: "hidden", opacity: 0 }}>
        <p className="pb-5 text-sm md:text-base text-[#1a1a2e]/70 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { clipPath: "inset(100% 0% 0% 0%)", yPercent: 20 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          yPercent: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#faf8f6]">
      <div className="max-w-3xl mx-auto px-6">
        <div
          ref={headingRef}
          className="text-center mb-14"
          style={{ clipPath: "inset(100% 0% 0% 0%)" }}
        >
          <span className="inline-block text-xs font-bold tracking-widest text-[#ff6b4e] uppercase mb-4">
            FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1a1a2e] leading-tight">
            Questions founders ask
          </h2>
        </div>
        <div>
          {faqs.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
