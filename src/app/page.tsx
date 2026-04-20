import { Navbar2 } from "@/components/Navbar2";
import { Hero } from "@/components/Hero";
import { ProblemSection2 } from "@/components/ProblemSection2";
import { HowItWorks2 } from "@/components/HowItWorks2";
import { FeaturesGrid2 } from "@/components/FeaturesGrid2";
import { TheMath } from "@/components/TheMath";
import { ChannelShowcase2 } from "@/components/ChannelShowcase2";
import { PricingSection2 } from "@/components/PricingSection2";
import { CtaSection2 } from "@/components/CtaSection2";
import { Footer2 } from "@/components/Footer2";

export default function Home() {
  return (
    <main className="bg-[#faf8f6] text-[#1a1a2e] min-h-screen font-sans selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e]">
      <Navbar2 />
      <Hero />
      <ProblemSection2 />
      <HowItWorks2 />
      {/* <FeaturesGrid2 /> */}
      <TheMath />
      <ChannelShowcase2 />
      <PricingSection2 />
      {/* <CtaSection2 /> */}
      <Footer2 />
    </main>
  );
}
