"use client";

import { useState } from "react";
import { Sparkles, Check, Loader2, Video, Lightbulb, Zap, Monitor, RefreshCw, UserCheck } from "lucide-react";
import type { Playbook } from "@/lib/types";

interface ContentIdea {
  channelName: string;
  video_title: string;
  concept: string;
  hook: string;
  format: string;
  why_this_works: string;
  personalisation_tip?: string;
}

interface Props {
  playbook: Playbook;
}

const TIER_2_NAMES = ["youtube", "instagram", "tiktok"];

function isTier2(name: string) {
  const n = name.toLowerCase();
  return TIER_2_NAMES.some((t) => n.includes(t));
}

function buildIcpSummary(playbook: Playbook) {
  const icp = playbook.icp;
  return `${icp.title}. ${icp.summary} Pain points: ${icp.painPoints.slice(0, 3).join(", ")}.`;
}

function IdeaCard({ idea, onRegenerate, regenerating }: {
  idea: ContentIdea;
  onRegenerate: (channelName: string) => void;
  regenerating: boolean;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1a1a2e]">{idea.channelName}</h3>
        <button
          onClick={() => onRegenerate(idea.channelName)}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </button>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
          <Video className="w-3.5 h-3.5" />
          Title
        </div>
        <p className="text-sm font-semibold text-[#1a1a2e]">{idea.video_title}</p>
      </div>

      {/* Format badge */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
          <Monitor className="w-3 h-3" />
          {idea.format}
        </span>
      </div>

      {/* Concept */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Concept</p>
        <p className="text-sm text-gray-700 leading-relaxed">{idea.concept}</p>
      </div>

      {/* Hook */}
      <div className="space-y-1 bg-white rounded-xl p-3 border border-purple-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
          <Zap className="w-3.5 h-3.5" />
          Opening Hook
        </div>
        <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{idea.hook}&rdquo;</p>
      </div>

      {/* Why this works */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <Lightbulb className="w-3.5 h-3.5" />
          Why This Works
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{idea.why_this_works}</p>
      </div>

      {/* Personalisation tip */}
      {idea.personalisation_tip && (
        <div className="space-y-1 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <UserCheck className="w-3.5 h-3.5" />
            Make It Personal
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">{idea.personalisation_tip}</p>
        </div>
      )}
    </div>
  );
}

const STORAGE_KEY = (id: string) => `tier2_ideas_${id}`;

export function WeeklyContentIdeas({ playbook }: Props) {
  const tier2Channels = playbook.channels.filter((c) => isTier2(c.name));

  const savedRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY(playbook.id)) : null;
  const savedIdeas: ContentIdea[] = savedRaw ? JSON.parse(savedRaw) : [];

  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    tier2Channels.map((c) => c.name)
  );
  const [ideas, setIdeas] = useState<ContentIdea[]>(savedIdeas);
  const [loading, setLoading] = useState(false);
  const [regeneratingChannel, setRegeneratingChannel] = useState<string | null>(null);
  const [error, setError] = useState("");

  const toggleChannel = (name: string) => {
    setSelectedChannels((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const callAPI = async (channels: string[]): Promise<ContentIdea[]> => {
    const res = await fetch("/api/generate-content-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedChannels: channels,
        productName: playbook.productName,
        productDescription: (playbook as any).productDescription || playbook.summary,
        icpSummary: buildIcpSummary(playbook),
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Generation failed");
    }
    const data = await res.json();
    return data.ideas as ContentIdea[];
  };

  const handleGenerate = async () => {
    if (selectedChannels.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const newIdeas = await callAPI(selectedChannels);
      setIdeas(newIdeas);
      localStorage.setItem(STORAGE_KEY(playbook.id), JSON.stringify(newIdeas));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (channelName: string) => {
    setRegeneratingChannel(channelName);
    setError("");
    try {
      const fresh = await callAPI([channelName]);
      const updated = ideas.map((i) => (i.channelName === channelName ? fresh[0] : i));
      if (!updated.find((i) => i.channelName === channelName)) updated.push(fresh[0]);
      setIdeas(updated);
      localStorage.setItem(STORAGE_KEY(playbook.id), JSON.stringify(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegeneratingChannel(null);
    }
  };

  if (tier2Channels.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-medium text-gray-500">
          No Tier 2 channels (YouTube, Instagram, TikTok) found in your playbook.
        </p>
        <p className="text-xs text-gray-400">
          These channels may not have been a strong fit for your product profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Weekly Content Ideas</h2>
        <p className="text-sm text-gray-500">
          Video concepts and hooks for YouTube, Instagram, and TikTok — not full scripts, but the creative direction that counts for 60% of the work.
        </p>
      </div>

      {/* Channel selection */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Channels</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tier2Channels.map((ch) => {
            const isSelected = selectedChannels.includes(ch.name);
            return (
              <button
                key={ch.name}
                onClick={() => toggleChannel(ch.name)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div>
                  <p className={`text-sm font-bold ${isSelected ? "text-purple-700" : "text-gray-800"}`}>
                    {ch.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{ch.fitScore}% match</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || selectedChannels.length === 0}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {loading
          ? "Generating ideas..."
          : ideas.length > 0
          ? "Regenerate All"
          : "Generate Content Ideas"}
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Ideas */}
      {ideas.length > 0 && (
        <div className="space-y-6 pt-2">
          <div className="h-px bg-black/5" />
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.channelName}
              idea={idea}
              onRegenerate={handleRegenerate}
              regenerating={regeneratingChannel === idea.channelName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
