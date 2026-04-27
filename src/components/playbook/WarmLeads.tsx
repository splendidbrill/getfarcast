"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Layers, BookOpen, MessageSquare, X, Copy, Check } from "lucide-react";

type Lead = {
    id: string;
    platform: string;
    username_or_name: string;
    bio_or_headline: string | null;
    profile_url: string;
    matched_text_preview: string | null;
    matched_keyword: string | null;
    source_url: string | null;
    created_at: string;
    intent_level: "high" | "medium" | "low" | null;
    lead_score: number | null;
    page_context: string | null;
    is_repeated: boolean | null;
    seen_count: number | null;
    engagement_weight: number | null;
};

type IntentFilter = "all" | "high" | "medium";

const PLATFORM_LABEL: Record<string, string> = {
    twitter_x: "X",
    linkedin: "LinkedIn",
    reddit: "Reddit",
};

const PLATFORM_COLORS: Record<string, string> = {
    twitter_x: "bg-gray-100 text-gray-700",
    linkedin: "bg-blue-50 text-blue-700",
    reddit: "bg-orange-50 text-orange-700",
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function IntentBadge({ level }: { level: "high" | "medium" | "low" | null }) {
    if (level === "high") {
        return (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                🔥 Hot
            </span>
        );
    }
    if (level === "medium") {
        return (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                ⚡ Warm
            </span>
        );
    }
    return null;
}

export function WarmLeads({ 
    playbookId,
    productName,
    productDescription
}: { 
    playbookId: string;
    productName?: string;
    productDescription?: string;
}) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");
    const [showAllPlaybooks, setShowAllPlaybooks] = useState(false);

    // DM Modal State
    const [dmLead, setDmLead] = useState<Lead | null>(null);
    const [isGeneratingDm, setIsGeneratingDm] = useState(false);
    const [dmText, setDmText] = useState("");
    const [copiedDm, setCopiedDm] = useState(false);

    const handleGenerateDm = async (lead: Lead) => {
        setDmLead(lead);
        setIsGeneratingDm(true);
        setDmText("");
        setCopiedDm(false);

        try {
            const res = await fetch("/api/generate-dm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName,
                    productDescription,
                    platform: lead.platform,
                    username_or_name: lead.username_or_name,
                    bio_or_headline: lead.bio_or_headline,
                    matched_text_preview: lead.matched_text_preview,
                    matched_keyword: lead.matched_keyword,
                    page_context: lead.page_context,
                }),
            });
            const json = await res.json();
            if (res.ok && json.dm) {
                setDmText(json.dm);
            } else {
                setDmText("Failed to generate DM. Please try again.");
            }
        } catch (err) {
            setDmText("An error occurred while generating the DM.");
        } finally {
            setIsGeneratingDm(false);
        }
    };

    const handleCopyDm = () => {
        navigator.clipboard.writeText(dmText);
        setCopiedDm(true);
        setTimeout(() => setCopiedDm(false), 2000);
    };

    const fetchLeads = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const params = new URLSearchParams();
            if (!showAllPlaybooks) params.set("playbookId", playbookId);
            const res = await fetch(`/api/extension/intent-leads?${params}`);
            const json = await res.json();
            console.log("[WarmLeads] API response", { status: res.status, playbookId, showAllPlaybooks, json });
            if (!res.ok) {
                setFetchError(json.error ?? `Request failed (${res.status})`);
                setLeads([]);
            } else {
                setLeads(json.leads ?? []);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Network error";
            setFetchError(msg);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playbookId, showAllPlaybooks]);

    const hotCount = leads.filter((l) => l.intent_level === "high").length;
    const warmCount = leads.filter((l) => l.intent_level === "medium").length;

    const filtered = leads.filter((lead) => {
        if (intentFilter === "high") return lead.intent_level === "high";
        if (intentFilter === "medium") return lead.intent_level === "medium";
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#1a1a2e]">Warm Leads</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        People expressing intent that matches your playbook keywords — captured as you browse.
                    </p>
                </div>
                <button
                    onClick={fetchLeads}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Intent filter tabs */}
                <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setIntentFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            intentFilter === "all"
                                ? "bg-white text-[#1a1a2e] shadow-sm"
                                : "text-gray-500 hover:text-[#1a1a2e]"
                        }`}
                    >
                        All{leads.length > 0 ? ` (${leads.length})` : ""}
                    </button>
                    <button
                        onClick={() => setIntentFilter("high")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            intentFilter === "high"
                                ? "bg-white text-[#1a1a2e] shadow-sm"
                                : "text-gray-500 hover:text-[#1a1a2e]"
                        }`}
                    >
                        🔥 Hot{hotCount > 0 ? ` (${hotCount})` : ""}
                    </button>
                    <button
                        onClick={() => setIntentFilter("medium")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            intentFilter === "medium"
                                ? "bg-white text-[#1a1a2e] shadow-sm"
                                : "text-gray-500 hover:text-[#1a1a2e]"
                        }`}
                    >
                        ⚡ Warm{warmCount > 0 ? ` (${warmCount})` : ""}
                    </button>
                </div>

                {/* Playbook scope toggle */}
                <button
                    onClick={() => setShowAllPlaybooks((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        showAllPlaybooks
                            ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                >
                    {showAllPlaybooks ? (
                        <>
                            <Layers className="w-3.5 h-3.5" />
                            All Playbooks
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-3.5 h-3.5" />
                            This Playbook
                        </>
                    )}
                </button>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && fetchError && (
                <div className="text-center py-20 space-y-2">
                    <p className="text-red-500 font-semibold text-sm">Failed to load leads</p>
                    <p className="text-xs text-gray-400 font-mono">{fetchError}</p>
                </div>
            )}

            {!loading && !fetchError && filtered.length === 0 && (
                <div className="text-center py-20 space-y-3">
                    <p className="text-gray-400 font-medium">
                        {leads.length === 0
                            ? "No leads captured yet."
                            : intentFilter === "high"
                            ? "No hot leads yet."
                            : intentFilter === "medium"
                            ? "No warm leads yet."
                            : "No leads match this filter."}
                    </p>
                    {leads.length === 0 && (
                        <p className="text-sm text-gray-400">
                            Browse X, LinkedIn, or Reddit with the Farcast extension installed and leads will appear here.
                        </p>
                    )}
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((lead) => (
                        <div
                            key={lead.id}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex gap-4"
                        >
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            PLATFORM_COLORS[lead.platform] ?? "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {PLATFORM_LABEL[lead.platform] ?? lead.platform}
                                    </span>

                                    <IntentBadge level={lead.intent_level} />

                                    {lead.is_repeated && (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                                            🔄 Repeat{lead.seen_count && lead.seen_count > 1 ? ` ×${lead.seen_count}` : ""}
                                        </span>
                                    )}

                                    {lead.matched_keyword && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ff6b4e]/10 text-[#ff6b4e]">
                                            {lead.matched_keyword}
                                        </span>
                                    )}

                                    {lead.page_context && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">
                                            {lead.page_context}
                                        </span>
                                    )}

                                    {lead.lead_score !== null && lead.lead_score > 0 && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100 ml-auto">
                                            {lead.lead_score}
                                        </span>
                                    )}

                                    <span className="text-xs text-gray-400">
                                        {timeAgo(lead.created_at)}
                                    </span>
                                </div>

                                <p className="font-bold text-[#1a1a2e] text-sm truncate">
                                    {lead.username_or_name}
                                </p>

                                {lead.bio_or_headline && (
                                    <p className="text-xs text-gray-500 line-clamp-1">
                                        {lead.bio_or_headline}
                                    </p>
                                )}

                                {lead.matched_text_preview && (
                                    <p className="text-xs text-gray-600 line-clamp-2 italic border-l-2 border-[#ff6b4e]/30 pl-2">
                                        &ldquo;{lead.matched_text_preview}&rdquo;
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 shrink-0">
                                <a
                                    href={lead.profile_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1a1a2e] text-white text-xs font-bold hover:opacity-80 transition"
                                >
                                    Profile <ExternalLink className="w-3 h-3" />
                                </a>
                                {lead.source_url && (
                                    <a
                                        href={lead.source_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-white transition"
                                    >
                                        Post <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                <button
                                    onClick={() => handleGenerateDm(lead)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition border border-green-200"
                                >
                                    DM <MessageSquare className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DM Modal */}
            {dmLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#ff6b4e]" />
                                Personalized DM for {dmLead.username_or_name}
                            </h3>
                            <button
                                onClick={() => setDmLead(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <strong>Context:</strong> {dmLead.matched_text_preview ? `"${dmLead.matched_text_preview}"` : "No specific post found."}
                            </div>
                            
                            <div className="min-h-[120px] bg-white border border-gray-200 rounded-xl p-4 relative">
                                {isGeneratingDm ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-gray-400">
                                        <div className="w-6 h-6 border-2 border-[#ff6b4e] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm font-medium animate-pulse">Drafting DM...</span>
                                    </div>
                                ) : (
                                    <textarea
                                        value={dmText}
                                        onChange={(e) => setDmText(e.target.value)}
                                        className="w-full h-full min-h-[100px] resize-none outline-none text-sm text-[#1a1a2e] placeholder-gray-400"
                                        placeholder="Generated DM will appear here..."
                                    />
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                onClick={() => setDmLead(null)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCopyDm}
                                disabled={isGeneratingDm || !dmText}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {copiedDm ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copiedDm ? "Copied!" : "Copy DM"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
