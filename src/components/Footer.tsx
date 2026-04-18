"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandLogoIcon } from "./BrandLogo";

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
    // { label: "Careers", href: "#" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    // { label: "Refund Policy", href: "#" },
  ],
};

export function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer id="footer" className="relative border-t border-gray-100 bg-[#faf8f6]" ref={footerRef}>
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand column */}
          <div
            className="md:col-span-5 transition-all duration-700"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <Link href="/" className="flex items-center gap-2.5 mb-6 group" id="footer-logo">
              <BrandLogoIcon
                size={22}
                className="transition-transform group-hover:scale-110 group-hover:rotate-6"
              />
              <span className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]">
                Get<span className="text-[#ff6b4e]">Farcast</span>
              </span>
            </Link>
            <p className="text-base text-gray-500 font-medium leading-relaxed max-w-sm mb-8">
              The AI-powered growth engine for founders. Tell us what you built
              and get a complete, agency-grade distribution playbook in minutes.
            </p>
            <div className="flex items-center gap-4">
              {/* Social links */}
              {[
                {
                  label: "X",
                  href: "https://x.com/shobitfarcast",
                  icon: (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                // {
                //   label: "LinkedIn",
                //   href: "#",
                //   icon: (
                //     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                //       <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                //     </svg>
                //   ),
                // },
              ].map((social, idx) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={"_blank"}
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#ff6b4e] hover:border-[#ff6b4e]/30 hover:shadow-sm transition-all duration-200 hover:-translate-y-1"
                  style={{
                    transitionDelay: `${(idx + 2) * 100}ms`,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(10px)",
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links], colIdx) => (
            <div
              key={category}
              className="md:col-span-2 transition-all duration-700"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${(colIdx + 1) * 150}ms`,
              }}
            >
              <h4 className="text-xs font-bold text-[#1a1a2e] uppercase tracking-widest mb-6">
                {category}
              </h4>
              <ul className="space-y-4">
                {links.map((link, idx) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-gray-500 hover:text-[#ff6b4e] transition-colors inline-block"
                      style={{
                        transitionDelay: `${(colIdx * 4 + idx + 3) * 50}ms`,
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateX(0)" : "translateX(-5px)",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(10px)",
            transitionDelay: "600ms",
          }}
        >
          <p className="text-sm font-semibold text-gray-400">
            &copy; {new Date().getFullYear()} GetFarcast. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-400">
              Built with conviction by founders, for founders.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}