"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { deletePlaybook } from "./actions";

export function DashboardClient({ playbooks }: { playbooks: any[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent linking
    if (!confirm("Are you sure you want to delete this playbook?")) return;
    setIsDeleting(id);
    try {
      await deletePlaybook(id);
      localStorage.removeItem(`playbook_${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete playbook");
    } finally {
      setIsDeleting(null);
    }
  };

  if (playbooks.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {playbooks.map((pb) => {
        // Extract sneak peek data safely from JSONB
        const topChannels = pb.data?.channels?.slice(0, 2).map((c: any) => c.name).join(" + ") || "Multiple Channels";
        
        return (
          <Link
            key={pb.id}
            href={`/playbook/${pb.id}`}
            className="group relative bg-white rounded-3xl p-6 border border-black/5 shadow-sm hover:shadow-xl hover:border-[#ff6b4e]/30 transition-all duration-300 flex flex-col h-full overflow-hidden"
          >
            {/* Top right gradient accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-[#ff6b4e]/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-[#ff6b4e]/10 text-[#ff6b4e] rounded-2xl flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <button
                onClick={(e) => handleDelete(pb.id, e)}
                disabled={isDeleting === pb.id}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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

            {/* Sneak Peek Data */}
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
  );
}
