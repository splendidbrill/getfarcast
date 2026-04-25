import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
    buildIntentLeadFingerprint,
    classifyIntentLevel,
    computeContextScore,
    computeEngagementScore,
    computeIcpBioScore,
    computeLeadScore,
    computeRecencyScore,
    getAuthenticatedExtensionUser,
    getExtensionCorsHeaders,
    isNegativeLead,
} from "@/lib/extension/server";
import { searchReddit } from "@/lib/reddit/search";

export const dynamic = "force-dynamic";

const cors = getExtensionCorsHeaders();

type ActivePlaybook = {
    id: string;
    product_name: string;
    intent_keywords: string[];
    recommended_subreddits: string[];
    icp_summary: string;
};

function extractKeywords(data: Record<string, unknown>): string[] {
    const nested = (data?.data ?? {}) as Record<string, unknown>;
    const playbook = (data?.playbook ?? {}) as Record<string, unknown>;

    const explicit = [
        ...((data?.intent_keywords as string[]) ?? []),
        ...((nested?.intent_keywords as string[]) ?? []),
        ...((playbook?.intent_keywords as string[]) ?? []),
    ].filter(Boolean);

    if (explicit.length > 0) return [...new Set(explicit)];

    const formData = (data?.formData ?? {}) as Record<string, unknown>;
    const icp = (playbook?.icp ?? {}) as Record<string, unknown>;

    const candidates = [
        formData?.problemItSolves,
        formData?.productDescription,
        formData?.targetAudience,
        icp?.summary,
        ...((icp?.painPoints as string[]) ?? []),
    ]
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .flatMap((s) =>
            s.split(/[\n,.;]|\b(?:and|or)\b/gi)
                .map((p) => p.trim().toLowerCase())
                .filter((p) => p.length >= 4)
        );

    return [...new Set(candidates)].slice(0, 25);
}

function extractSubreddits(data: unknown): string[] {
    const matches = JSON.stringify(data ?? {}).match(/r\/[A-Za-z0-9_]+/g) ?? [];
    return [...new Set(matches.map((s) => s.trim()))];
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: NextRequest) {
    const { user, error } = await getAuthenticatedExtensionUser(request);
    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: playbookRecords } = await admin
        .from("playbooks")
        .select("id, product_name, data")
        .eq("user_id", user.id);

    if (!playbookRecords?.length) {
        return NextResponse.json({ searched: 0, inserted: 0 }, { headers: cors });
    }

    const playbooks: ActivePlaybook[] = playbookRecords.map((r) => {
        const data = (r.data ?? {}) as Record<string, unknown>;
        return {
            id: r.id,
            product_name: r.product_name ?? "Untitled",
            intent_keywords: extractKeywords(data),
            recommended_subreddits: extractSubreddits(data),
            icp_summary: String(
                ((data?.playbook as Record<string, unknown>)?.icp as Record<string, unknown>)?.summary ?? ""
            ),
        };
    });

    const allRows: Record<string, unknown>[] = [];

    for (const playbook of playbooks) {
        if (playbook.intent_keywords.length === 0) continue;

        // Search recommended subreddits first, then fall back to global search
        const searchTargets: Array<{ keyword: string; subreddit?: string }> = [];

        for (const keyword of playbook.intent_keywords.slice(0, 10)) {
            if (playbook.recommended_subreddits.length > 0) {
                for (const sub of playbook.recommended_subreddits.slice(0, 3)) {
                    const name = sub.replace(/^r\//, "");
                    searchTargets.push({ keyword, subreddit: name });
                }
            } else {
                searchTargets.push({ keyword });
            }
        }

        for (const target of searchTargets) {
            let posts;
            try {
                posts = await searchReddit(target.keyword, target.subreddit);
            } catch {
                continue;
            }

            for (const post of posts) {
                const fullText = `${post.title} ${post.selftext}`.trim();
                if (!fullText || fullText.length < 20) continue;

                const intentLevel = classifyIntentLevel(fullText);
                if (intentLevel === "low") continue;

                const bioOrHeadline = null;
                const matchedText = fullText.slice(0, 500);

                if (isNegativeLead(bioOrHeadline, matchedText)) continue;

                const profileUrl = `https://www.reddit.com/user/${post.author}`;
                const sourceUrl = `https://www.reddit.com${post.permalink}`;
                const pageContext = `r/${post.subreddit}`;
                const postedAt = new Date(post.created_utc * 1000).toISOString();

                const fingerprint = buildIntentLeadFingerprint({
                    platform: "reddit",
                    profileUrl,
                    usernameOrName: post.author,
                    matchedKeyword: target.keyword,
                });

                const recencyScore = computeRecencyScore(postedAt);
                const contextScore = computeContextScore(
                    "reddit",
                    pageContext,
                    playbook.recommended_subreddits
                );
                const icpBioScore = computeIcpBioScore(bioOrHeadline, playbook.icp_summary);
                const engagementScore = computeEngagementScore(post.num_comments);
                const leadScore = computeLeadScore({
                    intentLevel,
                    recencyScore,
                    contextScore,
                    icpBioScore,
                    engagementScore,
                });

                allRows.push({
                    user_id: user.id,
                    playbook_id: playbook.id,
                    platform: "reddit",
                    fingerprint,
                    intent_level: intentLevel,
                    lead_score: leadScore,
                    username_or_name: post.author,
                    bio_or_headline: null,
                    profile_url: profileUrl,
                    matched_text_preview: matchedText.slice(0, 280),
                    matched_keyword: target.keyword,
                    source_url: sourceUrl,
                    posted_at: postedAt,
                    page_context: pageContext,
                    engagement_weight: post.num_comments,
                });
            }

            // Small delay between Reddit API calls to be polite
            await new Promise((r) => setTimeout(r, 300));
        }
    }

    if (allRows.length === 0) {
        return NextResponse.json({ searched: searchTargets.length ?? 0, inserted: 0 }, { headers: cors });
    }

    // Check for existing fingerprints (repeat detection)
    const fingerprints = allRows.map((r) => r.fingerprint as string);
    const { data: existing } = await admin
        .from("intent_leads")
        .select("fingerprint, seen_count")
        .eq("user_id", user.id)
        .in("fingerprint", fingerprints);

    const existingMap = new Map<string, number>(
        (existing ?? []).map((e) => [e.fingerprint as string, (e.seen_count as number) ?? 1])
    );

    const newRows = allRows.filter((r) => !existingMap.has(r.fingerprint as string));
    const repeatRows = allRows.filter((r) => existingMap.has(r.fingerprint as string));

    if (newRows.length > 0) {
        await admin.from("intent_leads").upsert(newRows, {
            onConflict: "user_id,fingerprint",
            ignoreDuplicates: true,
        });
    }

    for (const row of repeatRows) {
        const prev = existingMap.get(row.fingerprint as string) ?? 1;
        await admin
            .from("intent_leads")
            .update({
                seen_count: prev + 1,
                is_repeated: true,
                lead_score: Math.min(100, (row.lead_score as number) + 20),
            })
            .eq("user_id", user.id)
            .eq("fingerprint", row.fingerprint as string);
    }

    return NextResponse.json(
        { inserted: newRows.length, repeated: repeatRows.length },
        { headers: cors }
    );
}
