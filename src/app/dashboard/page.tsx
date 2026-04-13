"use client";

import { useEffect, useState } from "react";
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

      // Gate: check subscription status first
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }
      
      let status = user.app_metadata?.subscription_status;
      let trialEndDate = user.app_metadata?.trial_end_date;

      // Stale token recovery: Auth callback might have just assigned a trial that isn't in our JWT yet
      if (!status || status === 'none') {
        console.log('[dashboard] Status missing, attempting to refresh stale session tokens...');
        await supabase.auth.refreshSession();
        const { data: refreshed } = await supabase.auth.getUser();
        if (refreshed.user) {
          user = refreshed.user;
          status = user.app_metadata?.subscription_status;
          trialEndDate = user.app_metadata?.trial_end_date;
        }
      }
      
      if (status === 'canceled') {
        setTrialData({ status: 'expired' });
        return;
      }

      if (status === 'on_trial' && trialEndDate) {
        if (new Date() > new Date(trialEndDate)) {
          setTrialData({ status: 'expired' });
          return;
        }
      }

      if (!status || (status !== 'active' && status !== 'on_trial')) {
        window.location.href = '/api/checkout/starter';
        return;
      }

      setTrialData({
        status,
        trialEndDate
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
            
            // Avoid duplicates if already in cloud
            if (!loadedPlaybooks.some(p => p.id === playbook.id)) {
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
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a2e] tracking-tight mb-4">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]">Engine</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl">
            Access and manage all the 30-day growth playbooks you've generated. Ready to conquer a new channel?
          </p>
        </div>

        {trialData && <DashboardClient playbooks={playbooks} onDelete={handleDelete} trialData={trialData} />}
      </div>

      <Footer />
    </main>
  );
}
