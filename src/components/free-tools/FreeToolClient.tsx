"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, ArrowLeft, Zap } from "lucide-react";
import type { ToolConfig } from "@/lib/freeTools";

interface Props {
  tool: ToolConfig;
}

export function FreeToolClient({ tool }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const handleChange = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/free-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: tool.slug, inputs }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResults(data.results || []);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const allFilled = tool.inputs.every((input) => (inputs[input.name] || "").trim().length > 0);

  return (
    <>
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#ff6b4e]/6 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-2xl px-6">
          <Link
            href="/free-tools"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-[#1a1a2e] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All free tools
          </Link>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ff6b4e]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6b4e]">
            Free · No login required
          </div>
          <h1 className="mt-3 mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {tool.title}
          </h1>
          <p className="mb-10 text-base font-medium text-gray-500">{tool.description}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {tool.inputs.map((input) => (
              <div key={input.name}>
                <label className="mb-1.5 block text-sm font-bold text-[#1a1a2e]">
                  {input.label}
                </label>
                {input.type === "textarea" ? (
                  <textarea
                    rows={3}
                    placeholder={input.placeholder}
                    value={inputs[input.name] || ""}
                    onChange={(e) => handleChange(input.name, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#1a1a2e] placeholder:text-gray-400 focus:border-[#ff6b4e]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/20 resize-none transition-all"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={input.placeholder}
                    value={inputs[input.name] || ""}
                    onChange={(e) => handleChange(input.name, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#1a1a2e] placeholder:text-gray-400 focus:border-[#ff6b4e]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/20 transition-all"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={!allFilled || loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#1a1a2e] py-3.5 text-sm font-extrabold text-white transition-all hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </form>

          {error && (
            <div className={`mt-6 rounded-xl border px-4 py-3 text-sm font-medium ${
              error.startsWith("Rate limit")
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}>
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-5 text-lg font-extrabold text-[#1a1a2e]">{tool.outputLabel}</h2>
              <div className="space-y-3">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className="group relative flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#ff6b4e]/30 hover:shadow-sm"
                  >
                    <p className="flex-1 text-sm font-medium text-[#1a1a2e] leading-relaxed whitespace-pre-wrap">
                      {result}
                    </p>
                    <button
                      onClick={() => copyToClipboard(result, i)}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-all hover:bg-[#ff6b4e]/10 hover:text-[#ff6b4e]"
                    >
                      {copied === i ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {results.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-2xl bg-[#1a1a2e] p-8">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#ff6b4e]/25 blur-[60px]" />
            <div className="relative z-10">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#ff6b4e]">
                One tool, once. That&apos;s not a content strategy.
              </p>
              <h3 className="mb-3 text-xl font-extrabold text-white sm:text-2xl">
                {tool.ctaHeading}
              </h3>
              <p className="mb-6 text-sm font-medium text-white/60 leading-relaxed">
                {tool.ctaBody}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-[#ff6b4e] px-6 py-3 text-sm font-extrabold text-white transition-all hover:bg-[#e85d40] hover:scale-105"
              >
                {tool.ctaButton}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
