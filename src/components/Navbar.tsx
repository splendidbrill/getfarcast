"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [userInitial, setUserInitial] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      const sections = ["hero", "problem", "how-it-works", "features", "channels", "pricing", "cta"];
      for (const section of sections.reverse()) {
        const el = document.getElementById(section);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    
    // Auth check
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email || 'U';
        setUserInitial(name.charAt(0).toUpperCase());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email || 'U';
        setUserInitial(name.charAt(0).toUpperCase());
      } else {
        setUserInitial(null);
      }
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works", section: "how-it-works" },
    { label: "Features", href: "#features", section: "features" },
    { label: "Pricing", href: "#pricing", section: "pricing" },
  ];

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm"
          : "bg-transparent py-2"
      }`}
    >
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" id="logo-link">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-6">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#1a1a2e]">
            Get<span className="text-[#ff6b4e]">Farcast</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-black/5 shadow-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              id={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`text-sm font-semibold transition-all duration-200 relative group ${
                activeSection === link.section
                  ? "text-[#ff6b4e]"
                  : "text-gray-500 hover:text-[#1a1a2e]"
              }`}
            >
              {link.label}
              <span
                className={`absolute -bottom-[14px] left-0 h-[2px] bg-[#ff6b4e] transition-all duration-300 ${
                  activeSection === link.section ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          {userInitial ? (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] text-white flex items-center justify-center font-bold text-sm shadow-md">
              {userInitial}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#1a1a2e] transition-colors">
              Log in
            </Link>
          )}
          <Link
            href="/onboarding"
            id="nav-cta-start"
            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-[#ff6b4e]/20 hover:-translate-y-0.5"
          >
            Get Your Playbook
          </Link>
        </div>

        <button
          id="mobile-menu-toggle"
          className="md:hidden text-[#1a1a2e] p-2 hover:bg-black/5 rounded-lg transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-black/5 animate-fade-in-up shadow-xl absolute w-full left-0">
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-base font-bold py-3 px-4 rounded-xl transition-colors ${
                  activeSection === link.section
                    ? "bg-[#ff6b4e]/10 text-[#ff6b4e]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#1a1a2e]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <hr className="border-gray-100 my-4" />

            {userInitial ? (
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {userInitial}
                </div>
                <span className="font-semibold text-[#1a1a2e]">Your Account</span>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-bold text-gray-600 hover:text-[#1a1a2e]"
              >
                Log in
              </Link>
            )}
            
            <Link
              href="/onboarding"
              onClick={() => setMobileOpen(false)}
              className="block mt-4 px-6 py-3.5 text-base font-bold rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white text-center shadow-md"
            >
              Get Your Playbook
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
