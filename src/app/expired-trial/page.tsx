import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ExpiredTrialPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-[2rem] p-10 md:p-14 shadow-xl border border-black/5 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner relative z-10">
            <AlertCircle className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-black text-center text-[#1a1a2e] mb-4 relative z-10">
            Free Trial Ended
          </h1>
          
          <p className="text-center text-gray-500 mb-10 text-lg font-medium leading-relaxed relative z-10">
            You have already used up your free trial for this email account. Subscribe now to unlock your dashboard and generate more AI marketing content!
          </p>
          
          <div className="flex flex-col gap-4 relative z-10">
            <Link 
              href="/api/checkout/starter"
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold shadow-[0_8px_30px_rgb(255,107,78,0.3)] hover:shadow-[0_8px_40px_rgb(255,107,78,0.5)] transition-all hover:-translate-y-1 text-lg flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Subscribe for $10/mo
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
