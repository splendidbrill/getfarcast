"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowLeft, Check, Loader2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { WizardFormData, StoredPlaybook } from "@/lib/types";
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

interface PipelineStep {
  step: number;
  total: number;
  label: string;
  status: "waiting" | "running" | "done" | "partial";
  substep?: string;
  preview?: string;
}

const INITIAL_PIPELINE: PipelineStep[] = [
  { step: 1, total: 4, label: "Profiling your ideal customer...", status: "waiting" },
  { step: 2, total: 4, label: "Matching distribution channels...", status: "waiting" },
  { step: 3, total: 4, label: "Crafting channel strategies (expert rules applied)...", status: "waiting" },
  { step: 4, total: 4, label: "Writing outreach sequences...", status: "waiting" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [pipeline, setPipeline] = useState<PipelineStep[]>(INITIAL_PIPELINE);
  const [isComplete, setIsComplete] = useState(false);
  const [newPlaybookId, setNewPlaybookId] = useState("");

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const updatePipelineStep = (update: PipelineStep) => {
    setPipeline((prev) =>
      prev.map((p) =>
        p.step === update.step
          ? { ...p, ...update }
          : p
      )
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setPipeline(INITIAL_PIPELINE);

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
      let completed = false;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          const event = JSON.parse(jsonStr);

          if (event.type === "progress") {
            updatePipelineStep(event.data as PipelineStep);
          } else if (event.type === "complete") {
            const { playbook, formData: fd } = event.data;
            const stored: StoredPlaybook = { playbook, formData: fd };
            localStorage.setItem(`playbook_${playbook.id}`, JSON.stringify(stored));
            
            setNewPlaybookId(playbook.id);
            setIsComplete(true);
            setIsGenerating(false);
            return;
          } else if (event.type === "error") {
            throw new Error(event.data.message);
          }
        }
      }

      if (!completed) {
        throw new Error("Connection dropped. Please check the local server and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsGenerating(false);
      setPipeline(INITIAL_PIPELINE);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-[#1a1a2e] relative overflow-hidden">
      {/* Subtle warm grid background like Gojiberry */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 78, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 78, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Warm peachy hero gradient at top */}
      <div
        className="absolute top-0 inset-x-0 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,200,170,0.45) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-black/5 bg-white/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1a1a2e]">
              Get<span className="text-[#ff6b4e]">Farcast</span>
            </span>
          </Link>
          {!isGenerating && (
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-400 hover:text-[#1a1a2e] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to home
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Success / Complete state */}
        {isComplete ? (
          <div className="text-center space-y-8 py-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-[#1a1a2e] tracking-tight">
                Your Playbook is <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">Ready!</span>
              </h2>
              <p className="text-gray-500 font-medium max-w-md mx-auto">
                We've analyzed your product and built a bulletproof 30-day distribution engine tailored for {formData.productName}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href={`/playbook/${newPlaybookId}`}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-[#1a1a2e] text-white font-bold shadow-xl hover:shadow-2xl hover:bg-black transition-all hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Show My Playbook
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white border border-black/5 text-gray-500 font-bold shadow-sm hover:shadow-md hover:text-[#1a1a2e] transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] mb-2">
                Building your playbook...
              </h2>
              <p className="text-gray-500 text-sm">
                Our AI is crafting a growth strategy for{" "}
                <span className="text-[#ff6b4e] font-semibold">{formData.productName}</span>
              </p>
            </div>

            {/* Pipeline Steps */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-black/5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  AI Pipeline — {pipeline.filter((p) => p.status === "done").length}/{pipeline.length} steps complete
                </p>
              </div>
              <div className="divide-y divide-black/5">
                {pipeline.map((p) => (
                  <div key={p.step} className="flex items-start gap-4 p-5">
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {p.status === "done" ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : p.status === "running" || p.status === "partial" ? (
                        <div className="w-8 h-8 rounded-full bg-[#ff6b4e]/10 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-[#ff6b4e] animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-300">{p.step}</span>
                        </div>
                      )}
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          p.status === "done"
                            ? "text-emerald-600"
                            : p.status === "running" || p.status === "partial"
                              ? "text-[#1a1a2e]"
                              : "text-gray-300"
                        }`}
                      >
                        {p.label}
                        {p.substep && (
                          <span className="ml-2 text-xs text-gray-400">
                            ({p.substep})
                          </span>
                        )}
                      </p>
                      {p.preview && p.status === "done" && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {p.preview}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expert insight badge */}
            <div className="flex items-center gap-3 bg-[#ff6b4e]/5 rounded-2xl px-5 py-4 border border-[#ff6b4e]/10">
              <span className="text-xl">🎯</span>
              <p className="text-sm text-gray-600">
                <span className="text-[#ff6b4e] font-semibold">Expert knowledge injected.</span>{" "}
                Each channel strategy is powered by our curated playbooks — not generic AI advice.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => { setIsGenerating(false); setError(""); }}
                  className="mt-3 text-sm text-[#ff6b4e] underline hover:no-underline"
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
                    className={`flex items-center gap-2 transition-all duration-300 ${s.number < step ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        s.number === step
                          ? "bg-[#ff6b4e] text-white shadow-md"
                          : s.number < step
                            ? "bg-emerald-500 text-white"
                            : "bg-black/5 text-gray-300"
                      }`}
                    >
                      {s.number < step ? <Check className="w-3.5 h-3.5" /> : s.number}
                    </div>
                    <span
                      className={`text-sm hidden sm:block font-medium transition-colors ${
                        s.number === step ? "text-[#1a1a2e]" : s.number < step ? "text-emerald-500" : "text-gray-300"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((step - 1) / 3) * 100}%`,
                    background: "linear-gradient(90deg, #ff6b4e, #ff8c5a)",
                  }}
                />
              </div>
            </div>

            {/* Step content card */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-8">
              {step === 1 && <StepProductInfo data={formData} onChange={updateFormData} />}
              {step === 2 && <StepAudienceInfo data={formData} onChange={updateFormData} />}
              {step === 3 && <StepPricingInfo data={formData} onChange={updateFormData} />}
              {step === 4 && <StepGoalInfo data={formData} onChange={updateFormData} />}

              {error && (
                <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/5">
                <button
                  onClick={prevStep}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    step === 1
                      ? "opacity-0 pointer-events-none"
                      : "text-gray-500 hover:text-[#1a1a2e] border border-black/10 hover:border-black/20"
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
                    className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #ff6b4e, #ff8c5a)" }}
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #ff6b4e, #ff8c5a)" }}
                  >
                    <Zap className="w-4 h-4" />
                    Generate My Playbook
                  </button>
                )}
              </div>
            </div>

            {/* Trust signal */}
            <p className="text-center text-xs text-gray-400 mt-6">
              🔒 Expert-level strategy · Channel-specific · Ready to use in minutes
            </p>
          </>
        )}
      </div>
    </div>
  );
}
