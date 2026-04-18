import { LaunchPostsPage } from "@/components/playbook/LaunchPostsPage";
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

  // Load playbook server-side for SEO and initial render
  const supabase = await createClient();
  const { data } = await supabase
    .from("playbooks")
    .select("data")
    .eq("id", id)
    .single();

  const pbData = data?.data;
  const playbook: Playbook | null = pbData?.playbook ?? pbData ?? null;

  if (!playbook) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Playbook not found.</p>
      </div>
    );
  }

  return <LaunchPostsPage playbook={playbook} />;
}
