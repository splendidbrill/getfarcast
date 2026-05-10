import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { SharedPlaybookView } from "@/components/playbook/SharedPlaybookView";
import type { Playbook } from "@/lib/types";

async function fetchPlaybookByToken(token: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await admin
    .from("playbooks")
    .select("id, data")
    .eq("share_token", token)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await fetchPlaybookByToken(token);
  const raw = data?.data as any;
  const playbook = raw?.playbook ?? raw;
  const name = playbook?.productName ?? "Growth Playbook";
  return {
    title: `${name} Growth Playbook — GetFarcast`,
    description:
      playbook?.summary ?? "An AI-generated growth playbook from GetFarcast.",
  };
}

export default async function SharedPlaybookPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchPlaybookByToken(token);

  if (!data) return notFound();

  const raw = data.data as any;
  const playbook = (raw.playbook ?? raw) as Playbook;

  return (
    <SharedPlaybookView
      playbook={playbook}
      playbookId={data.id}
      shareToken={token}
    />
  );
}
