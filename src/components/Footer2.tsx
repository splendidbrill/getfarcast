"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BrandLogoIcon } from "./BrandLogo";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const footerLinks = {
  Product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Channels", href: "#channels" },
    { label: "Pricing", href: "#pricing" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer2() {
  const footerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(brandRef.current,
        { xPercent: -20, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: footerRef.current, start: "top 90%" } }
      );

      const cols = linksRef.current?.querySelectorAll(".footer-col");
      if (cols) {
        gsap.fromTo(Array.from(cols),
          { yPercent: 30, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, stagger: 0.1, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: footerRef.current, start: "top 90%" } }
        );
      }

      gsap.fromTo(bottomRef.current,
        { yPercent: 20, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "expo.out", delay: 0.4, scrollTrigger: { trigger: footerRef.current, start: "top 90%" } }
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer id="footer" ref={footerRef} className="relative border-t border-gray-100 bg-[#faf8f6]">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div ref={brandRef} className="md:col-span-5" style={{ opacity: 0 }}>
            <Link href="/" className="flex items-center gap-2.5 mb-6 group" id="footer-logo">
              <BrandLogoIcon size={22} className="transition-transform group-hover:scale-110 group-hover:rotate-6" />
              <span className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]">
                Get<span className="text-[#ff6b4e]">Farcast</span>
              </span>
            </Link>
            <p className="text-base text-gray-500 font-medium leading-relaxed max-w-sm mb-8">
              The AI-powered growth engine for founders. Tell us what you built and get a complete, agency-grade distribution playbook in minutes.
            </p>
            <a href="https://x.com/shobitfarcast" target="_blank" rel="noopener noreferrer" aria-label="X"
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 inline-flex items-center justify-center text-gray-400 hover:text-[#ff6b4e] hover:border-[#ff6b4e]/30 hover:shadow-sm transition-all duration-200 hover:-translate-y-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <div ref={linksRef} className="md:col-span-7 grid grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="footer-col" style={{ opacity: 0 }}>
                <h4 className="text-xs font-bold text-[#1a1a2e] uppercase tracking-widest mb-6">{category}</h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm font-medium text-gray-500 hover:text-[#ff6b4e] transition-colors inline-block">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div ref={bottomRef} className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ opacity: 0 }}>
          <p className="text-sm font-semibold text-gray-400">&copy; {new Date().getFullYear()} GetFarcast. All rights reserved.</p>
          <span className="text-sm font-semibold text-gray-400">Built with conviction by founders, for founders.</span>
        </div>
      </div>
    </footer>
  );
}
