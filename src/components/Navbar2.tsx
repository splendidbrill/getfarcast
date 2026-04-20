"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, CreditCard } from "lucide-react";
import { BrandLogoIcon } from "./BrandLogo";
import { createClient } from "@/lib/supabase/client";
import { sendGAEvent } from "@next/third-parties/google";
import { SignInModal } from "./SignInModal";
import gsap from "gsap";

export function Navbar2() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [userInitial, setUserInitial] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPagesRef = useRef<HTMLDivElement>(null);
  const menuInfoRef = useRef<HTMLDivElement>(null);
  const menuLettersRef = useRef<HTMLDivElement>(null);
  const menuMediaRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonTextRef = useRef<HTMLSpanElement>(null);
  const tlMenu = useRef<gsap.core.Timeline | null>(null);
  const menuIsOpen = useRef(false);

  const handlePostLoginRedirect = () => {
    if (pathname !== "/") return;
    const destination = window.sessionStorage.getItem("postLoginRedirect");
    if (!destination) return;
    window.sessionStorage.removeItem("postLoginRedirect");
    router.replace(destination);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((window.scrollY / totalHeight) * 100);
      const sections = ["hero", "problem", "how-it-works", "features", "channels", "pricing", "cta"];
      for (const section of [...sections].reverse()) {
        const el = document.getElementById(section);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email || "U";
        setUserInitial(name.charAt(0).toUpperCase());
        handlePostLoginRedirect();
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email || "U";
        setUserInitial(name.charAt(0).toUpperCase());
        handlePostLoginRedirect();
      } else {
        setUserInitial(null);
      }
    });

    // Init GSAP menu
    const menu = menuRef.current;
    const pages = menuPagesRef.current?.querySelectorAll("h2");
    const info = menuInfoRef.current?.querySelectorAll("span");
    const letters = menuLettersRef.current?.querySelectorAll(".letter");
    const media = menuMediaRef.current;

    if (menu && pages && info && letters && media) {
      gsap.set(menu, { pointerEvents: "none", clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(Array.from(pages), { yPercent: 200, autoAlpha: 0 });
      gsap.set(Array.from(info), { yPercent: 100, autoAlpha: 0 });
      gsap.set(Array.from(letters), { yPercent: 100, rotateY: 20, scale: 0.2 });
      gsap.set(media, { clipPath: "inset(0% 0% 100% 0%)" });

      tlMenu.current = gsap
        .timeline({ paused: true, defaults: { duration: 1.6, ease: "expo.inOut" } })
        .to(Array.from(pages), { yPercent: 0, autoAlpha: 1, stagger: 0.032 }, 0.24)
        .to(Array.from(info), { yPercent: 0, autoAlpha: 1, stagger: 0.032 }, 0.24)
        .to(Array.from(letters), { yPercent: 0, rotateY: 0, scale: 1, stagger: 0.032 }, 0)
        .to(media, { clipPath: "inset(0% 0% 0% 0%)" }, 0);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const animateButtonText = (text: string) => {
    const btn = buttonRef.current;
    const span = buttonTextRef.current;
    if (!btn || !span) return;
    gsap
      .timeline()
      .to(btn, { duration: 0.4, autoAlpha: 0, pointerEvents: "none" })
      .call(() => { span.textContent = text; })
      .to(btn, { duration: 0.4, autoAlpha: 1, pointerEvents: "auto" });
  };

  const toggleMenu = () => {
    const menu = menuRef.current;
    const tl = tlMenu.current;
    if (!menu || !tl) return;

    if (!menuIsOpen.current) {
      document.body.style.overflow = "hidden";
      gsap.to(menu, { duration: 1.2, pointerEvents: "auto", clipPath: "inset(0% 0% 0% 0%)", ease: "expo.inOut" });
      tl.play();
      animateButtonText("Close");
    } else {
      document.body.style.overflow = "";
      gsap.to(menu, {
        duration: 0.8,
        clipPath: "inset(0% 0% 100% 0%)",
        ease: "expo.inOut",
        onComplete: () => gsap.set(menu, { pointerEvents: "none", clipPath: "inset(100% 0% 0% 0%)" }),
      });
      tl.reverse(2);
      animateButtonText("Menu");
    }
    menuIsOpen.current = !menuIsOpen.current;
  };

  const closeMenuAndNavigate = (href: string) => {
    if (!menuIsOpen.current) return;
    toggleMenu();
    setTimeout(() => {
      if (href.startsWith("#")) {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(href);
      }
    }, 900);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    { label: "How It Works", href: "#how-it-works", section: "how-it-works" },
    { label: "Features", href: "#features", section: "features" },
    { label: "Pricing", href: "#pricing", section: "pricing" },
  ];

  const isHomePage = pathname === "/";

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm" : "bg-transparent py-2"
        }`}
      >
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group relative z-[60]"
            id="logo-link"
            onClick={() => window.sessionStorage.removeItem("postLoginRedirect")}
          >
            <BrandLogoIcon size={18} className="transition-transform group-hover:scale-110 group-hover:rotate-6" />
            <span className="text-xl font-extrabold tracking-tight text-[#1a1a2e]">
              <span className="text-[#ff6b4e]">Farcast</span>
            </span>
          </Link>

          {isHomePage && (
            <div className="hidden md:flex items-center gap-8 bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-black/5 shadow-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`text-sm font-semibold transition-all duration-200 relative group ${
                    activeSection === link.section ? "text-[#ff6b4e]" : "text-gray-500 hover:text-[#1a1a2e]"
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
          )}

          <div className="flex items-center gap-3 relative z-[60]">
            <div className="hidden md:flex items-center gap-3">
              {userInitial ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] text-white flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 transition-transform"
                  >
                    {userInitial}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in-up">
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        href="/api/portal"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" /> Manage Subscription
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm font-semibold text-gray-600 hover:text-[#1a1a2e] transition-colors"
                >
                  Log in
                </button>
              )}
            </div>

            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="flex items-center gap-2.5 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-black transition-all duration-200 cursor-pointer"
            >
              <span ref={buttonTextRef}>Menu</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b4e] flex-shrink-0" />
            </button>
          </div>
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      <div
        ref={menuRef}
        className="fixed inset-0 z-40 bg-[#1a1a2e] text-white overflow-hidden"
      >
        <div className="flex flex-col justify-between h-full pt-20 px-8 pb-8 md:px-16 md:pb-12">
          {/* Top: nav links + info */}
          <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-0">
            <div ref={menuPagesRef} className="flex flex-col">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "Get Started Free →", href: userInitial ? "/onboarding" : "#signin" },
              ].map((link) => (
                <div key={link.label} className="overflow-hidden py-1">
                  <h2
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight cursor-pointer hover:text-[#ff6b4e] transition-colors duration-200 tracking-tight"
                    onClick={() => {
                      if (link.href === "#signin") {
                        toggleMenu();
                        setTimeout(() => setIsLoginModalOpen(true), 900);
                      } else {
                        closeMenuAndNavigate(link.href);
                      }
                    }}
                  >
                    {link.label}
                  </h2>
                </div>
              ))}
            </div>

            <div ref={menuInfoRef} className="flex gap-12 md:gap-20">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">
                  Navigate
                </span>
                {navLinks.map((link) => (
                  <span
                    key={link.label}
                    className="text-sm font-semibold text-white/50 hover:text-white cursor-pointer transition-colors duration-200"
                    onClick={() => closeMenuAndNavigate(link.href)}
                  >
                    {link.label}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">
                  Account
                </span>
                {userInitial ? (
                  <>
                    <span
                      className="text-sm font-semibold text-white/50 hover:text-white cursor-pointer transition-colors"
                      onClick={() => closeMenuAndNavigate("/dashboard")}
                    >
                      Dashboard
                    </span>
                    <span
                      className="text-sm font-semibold text-white/50 hover:text-red-400 cursor-pointer transition-colors"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="text-sm font-semibold text-[#ff6b4e] hover:text-white cursor-pointer transition-colors"
                      onClick={() => {
                        toggleMenu();
                        setTimeout(() => setIsLoginModalOpen(true), 900);
                      }}
                    >
                      Sign In
                    </span>
                    <span className="text-sm font-semibold text-white/50 hover:text-white cursor-pointer transition-colors"
                      onClick={() => {
                        toggleMenu();
                        setTimeout(() => setIsLoginModalOpen(true), 900);
                      }}>
                      Create Account
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: media box + brand letters */}
          <div className="flex justify-between items-end">
            <div
              ref={menuMediaRef}
              className="w-40 h-28 md:w-64 md:h-40 rounded-2xl overflow-hidden flex-shrink-0"
            >
              <div className="w-full h-full bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🚀</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Growth Engine
                </span>
              </div>
            </div>

            <div
              ref={menuLettersRef}
              className="flex items-end"
              style={{ perspective: "1200px" }}
            >
              {"FARCAST".split("").map((letter, i) => (
                <h1
                  key={i}
                  className="letter font-extrabold leading-none text-white select-none"
                  style={{
                    fontSize: "clamp(3rem, 10vw, 9rem)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {letter}
                </h1>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SignInModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
