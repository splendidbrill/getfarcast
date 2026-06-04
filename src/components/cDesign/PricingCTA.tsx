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
      <button
        onClick={handleClick}
        className="w-full text-white text-[15px] font-medium py-3.5 rounded-xl hover:brightness-95 transition"
        style={{ backgroundColor: "#FF5A4D" }}
      >
        Start Pro • 7 days free
      </button>
      <SignInModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
