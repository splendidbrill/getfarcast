"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    // Check local storage for any existing playbooks
    let foundPlaybookId: string | null = null;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("playbook_")) {
          // Extract ID from playbook_<id>
          foundPlaybookId = key.replace("playbook_", "");
          break;
        }
      }
    } catch (e) {
      console.error("Failed to access local storage", e);
    }

    if (foundPlaybookId) {
      // User has filled the form, redirect to playbook
      router.replace(`/playbook/${foundPlaybookId}`);
    } else {
      // User hasn't filled the form, redirect to playbook generation
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="animate-pulse-soft">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-brand-500/20">
          <Zap className="w-8 h-8 text-white" />
        </div>
      </div>
      <p className="text-surface-200/50 animate-pulse text-sm">Getting your dashboard ready...</p>
    </div>
  );
}
