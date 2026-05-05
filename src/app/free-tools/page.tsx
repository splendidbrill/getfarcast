import Link from "next/link";
import { Navbar2 } from "@/components/Navbar2";
import { Footer2 } from "@/components/Footer2";
import { FREE_TOOLS } from "@/lib/freeTools";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Tools for Founders | Farcast",
  description:
    "6 free content tools for founders — Twitter/X bio generator, LinkedIn headline generator, hook generator, and more. No login required.",
};

export default function FreeToolsPage() {
  return (
    <main className="bg-[#faf8f6] text-[#1a1a2e] min-h-screen font-sans selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e]">
      <Navbar2 />

      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#ff6b4e]/6 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-500/4 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ff6b4e]/10 px-4 py-1.5 text-sm font-semibold text-[#ff6b4e]">
            Free Tools — No login required
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Tools every founder Googles
          </h1>
          <p className="mb-16 max-w-xl text-lg text-gray-500 font-medium leading-relaxed">
            6 free content tools. Pick one, get results in seconds, keep what you need.
            No account. No credit card.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FREE_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/free-tools/${tool.slug}`}
                className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#ff6b4e]/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6b4e]/10 text-lg font-extrabold text-[#ff6b4e] select-none">
                  {tool.icon}
                </div>
                <div>
                  <h2 className="mb-1 text-base font-extrabold text-[#1a1a2e]">{tool.title}</h2>
                  <p className="text-sm font-medium text-gray-500 leading-snug">{tool.tagline}</p>
                </div>
                <span className="mt-auto text-sm font-bold text-[#ff6b4e] group-hover:underline">
                  Try it free →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-[#1a1a2e] p-8 sm:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#ff6b4e]/20 blur-[80px]" />
          <div className="pointer-events-none absolute left-0 bottom-0 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px]" />
          <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ff6b4e]">
                20 tools are great. Daily content is better.
              </p>
              <h3 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
                Stop running tools. Start growing.
              </h3>
              <p className="max-w-md text-base font-medium text-white/60 leading-relaxed">
                Farcast is the AI content engine behind 9 posts a day, across every channel that
                matters — personalised to your voice and your build.
              </p>
            </div>
            <Link
              href="/"
              className="flex-shrink-0 rounded-full bg-[#ff6b4e] px-8 py-3.5 text-sm font-extrabold text-white transition-all hover:bg-[#e85d40] hover:scale-105"
            >
              Get your content engine →
            </Link>
          </div>
        </div>
      </section>

      <Footer2 />
    </main>
  );
}
