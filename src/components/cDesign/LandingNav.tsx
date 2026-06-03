"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SignInModal } from "@/components/SignInModal";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [userInitial, setUserInitial] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email || "U";
        setUserInitial(name.charAt(0).toUpperCase());
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email || "U";
        setUserInitial(name.charAt(0).toUpperCase());
      } else {
        setUserInitial(null);
      }
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      <nav className={`ld-nav${scrolled ? " scrolled" : ""}`}>
        <div className="ld-container ld-nav-inner">
          <Link className="ld-brand" href="/">
            <span className="ld-brand-mark">F</span>
            <span>Farcast</span>
          </Link>

          <div className="ld-nav-links">
            <a href="#extension">Extension</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQs</a>
            <Link href="/free-tools">Free Tools</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="https://calendly.com/shobit-getfarcast/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-[13px] text-stone-500 underline underline-offset-4 decoration-stone-300 hover:text-[#1C1917] transition-colors"
            >
              Looking for a demo?
            </a>
            <span className="hidden sm:inline-block w-px h-5 bg-stone-200" />
            {userInitial ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className="ld-nav-avatar-btn"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="Account menu"
                >
                  {userInitial}
                </button>
                {dropdownOpen && (
                  <div className="ld-nav-dropdown">
                    <Link href="/dashboard" onClick={() => setDropdownOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                      </svg>
                      Dashboard
                    </Link>
                    <Link href="/api/portal" onClick={() => setDropdownOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M5 8h2M5 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                      Manage Subscription
                    </Link>
                    <button className="danger" onClick={handleSignOut}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M10 11l3-3-3-3M13 8H6M6 3H3.5A1.5 1.5 0 002 4.5v7A1.5 1.5 0 003.5 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="ld-nav-cta" onClick={() => setLoginOpen(true)}>
                Log in
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 6h6m-2.5-2.5L9 6 6.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      <SignInModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
