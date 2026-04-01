"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { WizardFormData, Playbook, StoredPlaybook } from "@/lib/types";
import { StepProductInfo } from "./StepProductInfo";
import { StepAudienceInfo } from "./StepAudienceInfo";
import { StepPricingInfo } from "./StepPricingInfo";
import { StepGoalInfo } from "./StepGoalInfo";

const STEPS = [
  { number: 1, label: "Your Product" },
  { number: 2, label: "Audience" },
  { number: 3, label: "Pricing" },
  { number: 4, label: "Goal" },
];

const INITIAL_DATA: WizardFormData = {
  productName: "",
  productUrl: "",
  productDescription: "",
  problemItSolves: "",
  targetAudience: "",
  industry: "",
  pricingModel: "freemium",
  pricePoint: "",
  primaryGoal: "first-100",
  timeline: "1-month",
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [streamedText, setStreamedText] = useState("");

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setStreamedText("");

    try {
      const res = await fetch("/api/generate-playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamedText(fullText);
      }

      // Parse the full JSON response
      // Sometimes the LLM wraps it in ```json ... ```, strip that
      let cleanJson = fullText.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const playbookData = JSON.parse(cleanJson);

      // Build the full playbook object
      const id = crypto.randomUUID().slice(0, 8);
      const playbook: Playbook = {
        id,
        createdAt: new Date().toISOString(),
        productName: formData.productName,
        summary: playbookData.summary,
        icp: playbookData.icp,
        marketSizing: playbookData.marketSizing,
        channels: playbookData.channels,
        outreach: playbookData.outreach,
      };

      // Save to localStorage
      const stored: StoredPlaybook = { playbook, formData };
      localStorage.setItem(`playbook_${id}`, JSON.stringify(stored));

      // Navigate to dashboard
      router.push(`/playbook/${id}`);
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/5 rounded-full blur-[100px] animate-float-delayed" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-surface-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center transition-transform group-hover:scale-110">
              <Zap className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Get<span className="text-gradient-brand">Farcast</span>
            </span>
          </Link>
          {!isGenerating && (
            <Link
              href="/"
              className="text-sm text-surface-200/50 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Generating state */}
        {isGenerating ? (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-6 shadow-2xl shadow-brand-500/20 animate-pulse-soft">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Building your playbook...
              </h2>
              <p className="text-surface-200/50">
                Our AI is crafting a growth strategy tailored to{" "}
                <span className="text-brand-400 font-medium">
                  {formData.productName}
                </span>
              </p>
            </div>

            {/* Streaming output preview */}
            <div className="glass-card rounded-2xl p-6 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-surface-200/40 uppercase tracking-wider font-medium">
                  Live AI Output
                </span>
              </div>
              <pre className="text-xs text-surface-200/60 font-mono whitespace-pre-wrap break-all leading-relaxed">
                {streamedText || "Initializing..."}
                <span className="inline-block w-1.5 h-4 bg-brand-400 animate-pulse ml-0.5 align-middle" />
              </pre>
            </div>

            {error && (
              <div className="glass-card rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={() => {
                    setIsGenerating(false);
                    setError("");
                  }}
                  className="mt-3 text-sm text-white underline hover:no-underline"
                >
                  Go back and try again
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                {STEPS.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => s.number < step && setStep(s.number)}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      s.number < step
                        ? "cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        s.number === step
                          ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-500/20"
                          : s.number < step
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-surface-200/30"
                      }`}
                    >
                      {s.number < step ? "✓" : s.number}
                    </div>
                    <span
                      className={`text-sm hidden sm:block transition-colors ${
                        s.number === step
                          ? "text-white font-medium"
                          : s.number < step
                            ? "text-emerald-400/70"
                            : "text-surface-200/30"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
              {/* Progress track */}
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step content */}
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              {step === 1 && (
                <StepProductInfo data={formData} onChange={updateFormData} />
              )}
              {step === 2 && (
                <StepAudienceInfo data={formData} onChange={updateFormData} />
              )}
              {step === 3 && (
                <StepPricingInfo data={formData} onChange={updateFormData} />
              )}
              {step === 4 && (
                <StepGoalInfo data={formData} onChange={updateFormData} />
              )}

              {/* Error display */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={prevStep}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    step === 1
                      ? "opacity-0 pointer-events-none"
                      : "text-surface-200/60 hover:text-white border border-white/10 hover:border-white/20"
                  }`}
                >
                  Back
                </button>

                {step < 4 ? (
                  <button
                    onClick={() => {
                      if (step === 1 && (!formData.productName || !formData.productDescription)) {
                        setError("Product name and description are required.");
                        return;
                      }
                      setError("");
                      nextStep();
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:from-brand-400 hover:to-accent-400 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:scale-105"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-500 to-accent-500 text-white hover:from-brand-400 hover:to-accent-400 transition-all duration-200 shadow-lg shadow-brand-500/20 hover:scale-105 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Generate My Playbook
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
