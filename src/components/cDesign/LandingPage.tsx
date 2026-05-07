import "./landing.css";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingWall } from "./LandingWall";
import { LandingBento } from "./LandingBento";
import { LandingExtension } from "./LandingExtension";
import { LandingPhilosophy } from "./LandingPhilosophy";
import { LandingMath } from "./LandingMath";
import { LandingPricing } from "./LandingPricing";
import { LandingFAQ } from "./LandingFAQ";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="ld-root">
      <LandingNav />
      <LandingHero />
      <LandingWall />
      <LandingBento />
      <LandingExtension />
      <LandingPhilosophy />
      <LandingMath />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
    </div>
  );
}
