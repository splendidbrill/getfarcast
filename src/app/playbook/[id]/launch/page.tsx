import { LaunchPageClient } from "./LaunchPageClient";
import { createClient } from "@/lib/supabase/server";
import type { Playbook } from "@/lib/types";

export const metadata = {
  title: "Launch Your Product — GetFarcast",
};

export default async function LaunchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Try to load server-side for SEO/initial render; client will fall back
  // to localStorage if the row isn't in Supabase (e.g. anonymous generations).
  const supabase = await createClient();
  const { data } = await supabase
    .from("playbooks")
    .select("data")
    .eq("id", id)
    .single();

  const pbData = data?.data;
  const serverPlaybook: Playbook | null = pbData?.playbook ?? pbData ?? null;

  return <LaunchPageClient playbookId={id} serverPlaybook={serverPlaybook} />;
}
