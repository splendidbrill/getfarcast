"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignInModal } from "@/components/SignInModal";

export function PricingCTA() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleClick = () => {
    if (isLoggedIn) {
      router.push("/checkout");
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <>
      <button className="ld-pc-cta" onClick={handleClick}>
        Start your free trial
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <SignInModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
