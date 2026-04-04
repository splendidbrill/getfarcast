"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Globe, FileText, Lightbulb, RefreshCw } from "lucide-react";
import type { WizardFormData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface Props {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function StepProductInfo({ data, onChange }: Props) {
  const [pastPlaybooks, setPastPlaybooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlaybooks = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("playbooks")
        .select("id, product_name, data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setPastPlaybooks(data);
    };
    fetchPlaybooks();
  }, []);

  const handleSelectPastPlaybook = (id: string) => {
    if (!id) {
       onChange({ previousPlaybookId: undefined });
       return;
    }
    const pb = pastPlaybooks.find(p => p.id === id);
    if (pb && pb.data && pb.data.formData) {
       onChange({ ...pb.data.formData, previousPlaybookId: id });
    } else if (pb) {
       onChange({ productName: pb.product_name, previousPlaybookId: id });
    }
  };

  return (
    <div className="space-y-6">
      {pastPlaybooks.length > 0 && (
        <div className="bg-[#ff6b4e]/5 border border-[#ff6b4e]/20 p-5 rounded-2xl mb-8 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCw className="w-24 h-24 text-[#ff6b4e] -rotate-12" />
          </div>
          <div className="relative z-10">
            <label className="flex items-center gap-2 text-sm font-bold text-[#ce4a2f]">
              <RefreshCw className="w-4 h-4" /> Iterate on a past Playbook?
            </label>
            <p className="text-xs text-[#ce4a2f]/80 font-medium pb-2">
              Select a past playbook to automatically auto-fill your info and inject its performance ratings (🔥, 🥱) into your new strategy.
            </p>
            <select 
              value={data.previousPlaybookId || ""} 
              onChange={(e) => handleSelectPastPlaybook(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#ff6b4e]/20 text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 transition-all text-sm shadow-sm font-medium"
            >
              <option value="">Start from scratch (Brand new strategy)</option>
              {pastPlaybooks.map(pb => (
                <option key={pb.id} value={pb.id}>Iterate on: {pb.product_name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a2e]">Tell us what you built</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-11">
          The more specific you are, the better your playbook will be.
        </p>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <FileText className="w-4 h-4 text-gray-400" />
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          placeholder="e.g. GetFarcast"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm shadow-sm"
        />
      </div>

      {/* Product URL */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Globe className="w-4 h-4 text-gray-400" />
          Product URL
          <span className="text-xs text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={data.productUrl}
          onChange={(e) => onChange({ productUrl: e.target.value })}
          placeholder="https://yourproduct.com"
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm shadow-sm"
        />
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          What does it do? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.productDescription}
          onChange={(e) => onChange({ productDescription: e.target.value })}
          placeholder="Describe your product in 2-3 sentences. What is it? What does it help people do?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm resize-none shadow-sm"
        />
      </div>

      {/* Problem It Solves */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <Lightbulb className="w-4 h-4 text-gray-400" />
          What problem does it solve?
        </label>
        <textarea
          value={data.problemItSolves}
          onChange={(e) => onChange({ problemItSolves: e.target.value })}
          placeholder="What pain point or frustration does your product solve? Be specific."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-all text-sm resize-none shadow-sm"
        />
      </div>
    </div>
  );
}
