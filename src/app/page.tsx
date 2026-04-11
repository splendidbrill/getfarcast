import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { ChannelShowcase } from "@/components/ChannelShowcase";
import { PricingSection } from "@/components/PricingSection";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-[#faf8f6] text-[#1a1a2e] min-h-screen font-sans selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e]">
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <FeaturesGrid />
      <ChannelShowcase />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
