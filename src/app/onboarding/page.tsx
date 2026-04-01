import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Get Your Growth Playbook — GetFarcast",
  description:
    "Tell us about your product and get a complete distribution playbook with ICP profiling, channel strategy, and ready-to-post content.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
