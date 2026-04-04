import type { Metadata } from "next";
import { PlaybookDashboard } from "@/components/playbook/PlaybookDashboard";

export const metadata: Metadata = {
  title: "Your Growth Playbook — GetFarcast",
  description: "Your AI-generated growth playbook with ICP profiling, channel strategy, content templates, and outreach sequences.",
};

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlaybookDashboard id={id} />;
}
