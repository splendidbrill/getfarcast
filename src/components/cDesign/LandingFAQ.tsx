"use client";

import { useState } from "react";

const FAQS = [
  { q: "What do Farcast Growth Agents actually do for my business?", a: "Think of Farcast as your AI growth team. It handles the manual heavy lifting of indie hacking: mapping your exact ICP, sourcing warm leads, and generating your daily posts so you can get users while you focus on building." },
  { q: "How do the Growth Agents analyze my target customers?", a: "We don't just scrape a website link and guess. Our agents are trained on the same strategic frameworks used by top-tier growth agencies. They ask deep questions about your business to map your true ICP, determine exactly where they hang out online, and pinpoint buying triggers." },
  { q: "How does the \"Reply Guy\" feature work?", a: "To grow from scratch, you have to be active in the comments. Our Chrome extension handles the heavy lifting by generating context-aware, high-value replies for LinkedIn, X, and Reddit. It thinks of the perfect response for you so you can build authority without wasting hours staring at a blank text box." },
  { q: "Which platforms are supported?", a: "We focus exclusively on the channels that actually convert for B2B and Micro-SaaS. Text-Based Growth: LinkedIn, X (Twitter), and Reddit. We provide a focused sniper rifle for high-intent platforms." },
  { q: "Does the agent post content automatically?", a: "Not yet, but \"Full Autopilot\" is coming soon. Currently, our agents generate \"Ready-to-Post\" content that requires minimal review. This ensures you maintain 100% control over your brand voice and avoid API bans while still benefiting from AI speed." },
  { q: "How many leads will I get per day and from which channels?", a: "With our Starter Pack, you'll receive 30 high-intent leads per day. These are sourced from LinkedIn, Reddit, and X, ensuring you reach potential customers actively talking about the pain points your app solves." },
  { q: "How long until I see results?", a: "You'll see your first batch of analyzed leads and drafted content within 10 minutes. Most founders report a significant increase in profile views and inbound inquiries within the first 14 days of consistent activity." },
  { q: "What is your refund policy?", a: "We want you to be 100% happy with Farcast. If your free trial ends and a subscription is triggered, but you decide you don't want to continue, just send a quick note to hello@getfarcast.com and we will refund your payment." },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq" className="ld-section">
      <div className="ld-container-narrow">
        <div className="ld-section-head center">
          <span className="ld-section-eyebrow">FAQ</span>
          <h2 className="ld-section-title">Questions founders ask.</h2>
        </div>
        <div className="ld-faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`ld-faq-item${openIndex === i ? " open" : ""}`}>
              <button className="ld-faq-q" onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="toggle">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </span>
              </button>
              <div className="ld-faq-a">
                <div className="ld-faq-a-inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
