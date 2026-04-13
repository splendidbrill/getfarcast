"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, BookOpen, AlertCircle, Sparkles } from "lucide-react";

export function DashboardClient({ playbooks, onDelete, trialData }: { playbooks: any[]; onDelete: (id: string) => void; trialData?: any }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent linking
    if (!confirm("Are you sure you want to delete this playbook?")) return;
    setIsDeleting(id);
    try {
      localStorage.removeItem(`playbook_${id}`);
      onDelete(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete playbook");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelTrialClick = () => setShowCancelModal(true);

  const executeCancelTrial = async () => {
    setIsCanceling(true);
    try {
      const res = await fetch("/api/cancel-trial", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to cancel trial");
      }
    } catch {
      alert("Failed to cancel trial");
    } finally {
      setIsCanceling(false);
      setShowCancelModal(false);
    }
  };

  const daysRemaining = trialData?.trialEndDate 
    ? Math.max(0, Math.ceil((new Date(trialData.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (trialData?.status === 'expired') {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-black/5 shadow-sm relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-[100px]" />
        
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-3xl font-black text-[#1a1a2e] mb-4 relative z-10">Trial Expired</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium text-lg relative z-10 leading-relaxed">
          You have already used up your free trial. Subscribe now to restore full access to your content playbooks and strategy dashboards!
        </p>
        <Link 
          href="/api/checkout/starter"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold shadow-[0_8px_30px_rgb(255,107,78,0.3)] hover:shadow-[0_8px_40px_rgb(255,107,78,0.5)] transition-all hover:-translate-y-1 relative z-10 text-lg"
        >
          <Sparkles className="w-6 h-6" />
          Subscribe for $10/mo
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {trialData?.status === 'on_trial' && (
          <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-[#ff6b4e]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-orange-100 text-[#ff6b4e] rounded-2xl flex items-center justify-center font-bold shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-900 leading-tight">Free Trial: {daysRemaining} Days Remaining</h3>
                <p className="text-sm text-orange-700 font-medium">Subscribe now to keep full access to your playbooks.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
              <button 
                onClick={handleCancelTrialClick} 
                className="px-4 py-2 text-sm font-bold text-orange-700 hover:text-orange-900 hover:bg-orange-100 rounded-xl transition-colors flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <Link 
                href="/api/checkout/starter" 
                className="px-5 py-2 text-sm font-bold bg-[#ff6b4e] text-white rounded-xl shadow-md hover:bg-[#e05a3f] transition-colors flex-1 sm:flex-none text-center"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        )}

        {playbooks.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-black/5 shadow-sm relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ff6b4e]/5 rounded-full blur-[80px]" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b4e]/20 to-[#ff8c5a]/20 text-[#ff6b4e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#1a1a2e] mb-3 relative z-10">No Playbooks Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium text-sm relative z-10">
              You haven't generated any growth strategies yet. Let's create your first 30-day content engine!
            </p>
            <Link 
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold shadow-md hover:shadow-xl hover:shadow-[#ff6b4e]/20 transition-all hover:-translate-y-0.5 relative z-10"
            >
              <Sparkles className="w-5 h-5" />
              Generate First Playbook
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playbooks.map((pb) => {
              const channelsData = pb.data?.playbook?.channels || pb.data?.channels || [];
              const topChannels = channelsData.slice(0, 2).map((c: any) => c.name).join(" + ") || "Multiple Channels";
              return (
                <Link
                  key={pb.id}
                  href={`/playbook/${pb.id}`}
                  className="group relative bg-white rounded-3xl p-6 border border-black/5 shadow-sm hover:shadow-xl hover:border-[#ff6b4e]/30 transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-[#ff6b4e]/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[#ff6b4e]/10 text-[#ff6b4e] rounded-2xl flex items-center justify-center font-bold">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <button
                      onClick={(e) => handleDelete(pb.id, e)}
                      disabled={isDeleting === pb.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-20"
                      title="Delete playbook"
                    >
                      {isDeleting === pb.id ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent flex items-center justify-center rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-1 mb-6 flex-1">
                    <h3 className="text-xl font-bold text-[#1a1a2e] group-hover:text-[#ff6b4e] transition-colors line-clamp-1">
                      {pb.product_name}
                    </h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {new Date(pb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:border-[#ff6b4e]/10 group-hover:bg-[#ff6b4e]/5 transition-colors">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Top Channels</p>
                    <p className="text-sm font-semibold text-[#1a1a2e]">{topChannels}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between text-[#1a1a2e]">
                    <span className="text-sm font-bold">View full playbook</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#ff6b4e]" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center font-bold mb-6 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-center text-[#1a1a2e] mb-3">Cancel Free Trial?</h3>
            <p className="text-center text-gray-600 mb-8 font-medium">
              Are you absolutely sure you want to cancel? If you cancel your trial, <span className="font-bold text-[#1a1a2e]">you will immediately lose access to your dashboard and all generated playbooks</span>. 
            </p>
            <div className="flex flex-col gap-3 relative z-10">
              <button 
                onClick={executeCancelTrial} 
                disabled={isCanceling}
                className="w-full py-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                {isCanceling ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent flex items-center justify-center rounded-full animate-spin" />
                ) : (
                  "Yes, Cancel Trial"
                )}
              </button>
              <button 
                onClick={() => setShowCancelModal(false)} 
                disabled={isCanceling}
                className="w-full py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                No, Keep Access
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
