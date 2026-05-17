import { headers } from "next/headers";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import WhopEmbed from "./WhopEmbed";

export default async function CheckoutPage() {
  await headers(); // opts into dynamic rendering — env vars read at request time
  const provider = process.env.PAYMENT_PROVIDER ?? "whop";
  const planId = process.env.NEXT_PUBLIC_WHOP_PLAN_ID ?? "";

  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1a1a2e]">
              Get<span className="text-[#ff6b4e]">Farcast</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-[#1a1a2e] transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col items-center gap-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-black text-[#1a1a2e] mb-3">
            Subscribe to GetFarcast
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            $39/month. Cancel anytime. Full access to your playbooks, content engine, and launch tools.
          </p>
        </div>

        {provider === "whop" ? (
          <WhopEmbed planId={planId} />
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center gap-4">
            <a
              href="/api/checkout/starter"
              className="w-full flex items-center justify-center gap-2 bg-[#ff6b4e] hover:bg-[#e85a3d] text-white text-base font-bold py-4 px-8 rounded-2xl shadow-md transition-colors"
            >
              Continue to Checkout
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </a>
            <p className="text-xs text-gray-400">You&apos;ll be redirected to our secure payment page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
