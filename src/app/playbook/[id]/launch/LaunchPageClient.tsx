"use client";

import { useEffect, useState } from "react";
import { LaunchPostsPage } from "@/components/playbook/LaunchPostsPage";
import type { Playbook } from "@/lib/types";

interface Props {
  playbookId: string;
  serverPlaybook: Playbook | null;
}

export function LaunchPageClient({ playbookId, serverPlaybook }: Props) {
  const [playbook, setPlaybook] = useState<Playbook | null>(serverPlaybook);
  const [loaded, setLoaded] = useState(serverPlaybook !== null);

  useEffect(() => {
    if (serverPlaybook) return;

    const raw = localStorage.getItem(`playbook_${playbookId}`);
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        const pb = stored.playbook ?? stored;
        if (pb) {
          setPlaybook(pb as Playbook);
          setLoaded(true);
          return;
        }
      } catch {
        // fall through
      }
    }

    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("playbooks")
          .select("data")
          .eq("id", playbookId)
          .single();
        const pbData = data?.data;
        const pb: Playbook | null = pbData?.playbook ?? pbData ?? null;
        setPlaybook(pb);
      } finally {
        setLoaded(true);
      }
    })();
  }, [playbookId, serverPlaybook]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff6b4e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Playbook not found.</p>
      </div>
    );
  }

  return <LaunchPostsPage playbook={playbook} />;
}
