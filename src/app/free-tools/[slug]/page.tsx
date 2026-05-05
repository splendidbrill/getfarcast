import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Navbar2 } from "@/components/Navbar2";
import { Footer2 } from "@/components/Footer2";
import { FreeToolClient } from "@/components/free-tools/FreeToolClient";
import { getToolBySlug, FREE_TOOLS } from "@/lib/freeTools";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.title} — Free | Farcast`,
    description: `${tool.description} Free, instant, no login required.`,
  };
}

export function generateStaticParams() {
  return FREE_TOOLS.map((t) => ({ slug: t.slug }));
}

export default async function FreeToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <main className="bg-[#faf8f6] text-[#1a1a2e] min-h-screen font-sans selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e]">
      <Navbar2 />
      <FreeToolClient tool={tool} />
      <Footer2 />
    </main>
  );
}
