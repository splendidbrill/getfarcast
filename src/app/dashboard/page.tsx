"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardClient } from "./DashboardClient";
import { createClient } from "@/lib/supabase/client";

interface LocalPlaybook {
  id: string;
  product_name: string;
  created_at: string;
  data: any;
}

export default function DashboardPage() {
  const [playbooks, setPlaybooks] = useState<LocalPlaybook[]>([]);

  const [trialData, setTrialData] = useState<any>(null);

  useEffect(() => {
    async function loadPlaybooks() {
      const supabase = createClient();

      // Gate: verify the user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }

      // If redirected from Polar checkout, activate the user immediately
      const urlParams = new URLSearchParams(window.location.search);
      const polarToken = urlParams.get('customer_session_token');
      if (polarToken) {
        try {
          await fetch('/api/polar/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: polarToken }),
          });
        } catch (e) {
          console.error('[dashboard] polar activate failed', e);
        }
        // Clean the token from the URL
        window.history.replaceState({}, '', '/dashboard');
      }

      // Always read subscription status from the server (bypasses stale JWT app_metadata)
      let status: string | null = null;
      let trialEndDate: string | null = null;
      let subscriptionEndDate: string | null = null;

      try {
        const res = await fetch('/api/subscription-status');
        if (res.ok) {
          const data = await res.json();
          status = data.subscription_status;
          trialEndDate = data.trial_end_date;
          subscriptionEndDate = data.subscription_end_date;
        }
      } catch (e) {
        console.error('[dashboard] subscription-status fetch failed', e);
      }

      // New user with no status yet — assign a trial
      if (!status || status === 'none') {
        try {
          const res = await fetch('/api/ensure-trial');
          if (res.ok) {
            const data = await res.json();
            status = data.subscription_status;
            trialEndDate = data.trial_end_date;
            subscriptionEndDate = data.subscription_end_date;
          }
        } catch (e) {
          console.error('[dashboard] ensure-trial fallback failed', e);
        }
      }

      if (status === 'canceled') {
        setTrialData({ status: 'canceled', trialEndDate });
      } else if (status === 'trial_exhausted') {
        setTrialData({ status: 'expired' });
        return;
      } else if (status === 'on_trial' && trialEndDate) {
        if (new Date() > new Date(trialEndDate)) {
          setTrialData({ status: 'expired' });
          return;
        }
      } else if (status === 'active' && subscriptionEndDate) {
        if (new Date() > new Date(subscriptionEndDate)) {
          setTrialData({ status: 'expired' });
          return;
        }
      }

      setTrialData({
        status: status || 'on_trial',
        trialEndDate,
        subscriptionEndDate,
      });

      const loadedPlaybooks: LocalPlaybook[] = [];

      // 1. Load from Supabase
      const { data: cloudPlaybooks, error } = await supabase
        .from("playbooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase load error:", error);
      } else if (cloudPlaybooks) {
        cloudPlaybooks.forEach((p: any) => {
          loadedPlaybooks.push({
            id: p.id,
            product_name: p.product_name,
            created_at: p.created_at,
            data: p.data,
          });
        });
      }

      // 2. Load from localStorage (as fallback or migration)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("playbook_")) {
          try {
            const stored = JSON.parse(localStorage.getItem(key)!);
            const { playbook, formData } = stored;

            // Avoid duplicates if already in cloud; skip entries with no id
            if (playbook?.id && !loadedPlaybooks.some(p => p.id === playbook.id)) {
              loadedPlaybooks.push({
                id: playbook.id,
                product_name: playbook.productName,
                created_at: playbook.createdAt,
                data: { playbook, formData },
              });
            }
          } catch (e) {
            console.error("Failed to parse local playbook:", key, e);
          }
        }
      }

      // Sort final unified list by created_at descending
      loadedPlaybooks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPlaybooks(loadedPlaybooks);
    }

    loadPlaybooks();
  }, []);

  const handleDelete = (id: string) => {
    setPlaybooks(prev => prev.filter(p => p.id !== id));
  };

  return (
    <main className="bg-[#faf8f6] text-[#1a1a2e] min-h-screen font-sans selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e] flex flex-col">
      <Navbar />

      {/* Background aesthetics */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 78, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 78, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed top-0 inset-x-0 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,200,170,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-24 relative z-10">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a2e] tracking-tight mb-4">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]">Growth Engine</span>
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-2xl">
              Every playbook can be a path to your first 1000 users.
Built for your product, your ICP, and the channels they actually live on. Start one or continue where you left off.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold shadow-md hover:shadow-xl hover:shadow-[#ff6b4e]/20 transition-all hover:-translate-y-0.5 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            New Playbook
          </Link>
        </div>

        {!trialData ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#ff6b4e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DashboardClient playbooks={playbooks} onDelete={handleDelete} trialData={trialData} />
      )}
      </div>

      <Footer />
    </main>
  );
}
