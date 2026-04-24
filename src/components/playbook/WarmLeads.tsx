"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

type Lead = {
    id: string;
    platform: string;
    username_or_name: string;
    bio_or_headline: string | null;
    profile_url: string;
    matched_text_preview: string | null;
    matched_keyword: string | null;
    source_url: string | null;
    captured_at: string;
};

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

export function WarmLeads({ playbookId }: { playbookId: string }) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/extension/intent-leads?playbookId=${playbookId}`);
            const json = await res.json();
            setLeads(json.leads ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeads(); }, [playbookId]);

    return (
        <div className="space-y-6">
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

            {loading && (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && leads.length === 0 && (
                <div className="text-center py-20 space-y-3">
                    <p className="text-gray-400 font-medium">No leads captured yet.</p>
                    <p className="text-sm text-gray-400">
                        Browse X, LinkedIn, or Reddit with the Farcast extension installed and leads will appear here.
                    </p>
                </div>
            )}

            {!loading && leads.length > 0 && (
                <div className="space-y-3">
                    {leads.map((lead) => (
                        <div
                            key={lead.id}
                            className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex gap-4"
                        >
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLATFORM_COLORS[lead.platform] ?? "bg-gray-100 text-gray-600"}`}>
                                        {PLATFORM_LABEL[lead.platform] ?? lead.platform}
                                    </span>
                                    {lead.matched_keyword && (
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ff6b4e]/10 text-[#ff6b4e]">
                                            {lead.matched_keyword}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto">{timeAgo(lead.captured_at)}</span>
                                </div>

                                <p className="font-bold text-[#1a1a2e] text-sm truncate">{lead.username_or_name}</p>

                                {lead.bio_or_headline && (
                                    <p className="text-xs text-gray-500 line-clamp-1">{lead.bio_or_headline}</p>
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
