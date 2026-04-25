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
    sanitizeIntentLead,
} from "@/lib/extension/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const cors = getExtensionCorsHeaders();

type RawLead = {
    username_or_name: string;
    bio_or_headline?: string;
    profile_url: string;
    matched_text_preview?: string;
    matched_keyword?: string;
    source_url?: string;
    posted_at?: string;
    page_context?: string;
    intent_level?: string;
    engagement_weight?: number;
};

type RequestBody = {
    leads: RawLead[];
    platform: string;
    playbook_id: string;
    icp_summary?: string;
    recommended_subreddits?: string[];
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: cors });
}

// Called by the extension to submit captured leads
export async function POST(request: NextRequest) {
    const { user, error } = await getAuthenticatedExtensionUser(request);

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    }

    const body: RequestBody | null = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.leads) || !body.platform || !body.playbook_id) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: cors });
    }

    const recommendedSubreddits = body.recommended_subreddits ?? [];
    const platform = body.platform as "twitter_x" | "reddit" | "linkedin";

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rows = body.leads
        .filter((l) => l.username_or_name && l.profile_url)
        // Drop job seekers, students, agency service-sellers, and hiring posts
        .filter((l) => !isNegativeLead(l.bio_or_headline, l.matched_text_preview))
        .map((lead) => {
            const sanitized = sanitizeIntentLead(lead);
            const fingerprint = buildIntentLeadFingerprint({
                platform,
                profileUrl: sanitized.profile_url,
                usernameOrName: sanitized.username_or_name,
                matchedKeyword: sanitized.matched_keyword ?? "",
            });

            const textForClassification = [
                sanitized.matched_text_preview ?? "",
                sanitized.matched_keyword ?? "",
            ].join(" ");

            // Trust extension hint if valid, otherwise classify server-side
            const rawHint = lead.intent_level;
            const intentLevel =
                rawHint === "high" || rawHint === "medium" || rawHint === "low"
                    ? rawHint
                    : classifyIntentLevel(textForClassification);

            const recencyScore = computeRecencyScore(sanitized.posted_at);
            const contextScore = computeContextScore(
                platform,
                sanitized.page_context,
                recommendedSubreddits
            );
            const icpBioScore = computeIcpBioScore(
                sanitized.bio_or_headline,
                body.icp_summary ?? null
            );
            const engagementScore = computeEngagementScore(sanitized.engagement_weight);
            const leadScore = computeLeadScore({
                intentLevel,
                recencyScore,
                contextScore,
                icpBioScore,
                engagementScore,
                // repeatBoost applied below after querying DB
            });

            return {
                user_id: user.id,
                playbook_id: body.playbook_id,
                platform,
                fingerprint,
                intent_level: intentLevel,
                lead_score: leadScore,
                ...sanitized,
            };
        });

    if (rows.length === 0) {
        return NextResponse.json({ inserted: 0 }, { headers: cors });
    }

    // Check which fingerprints already exist to apply repeat signal boost
    const fingerprints = rows.map((r) => r.fingerprint);
    const { data: existingLeads } = await admin
        .from("intent_leads")
        .select("fingerprint,seen_count")
        .eq("user_id", user.id)
        .in("fingerprint", fingerprints);

    const existingMap = new Map<string, number>(
        (existingLeads ?? []).map((e) => [e.fingerprint as string, (e.seen_count as number) ?? 1])
    );

    const newRows = rows.filter((r) => !existingMap.has(r.fingerprint));
    const repeatRows = rows.filter((r) => existingMap.has(r.fingerprint));

    // Insert genuinely new leads
    if (newRows.length > 0) {
        const { error: insertError } = await admin
            .from("intent_leads")
            .upsert(newRows, { onConflict: "user_id,fingerprint", ignoreDuplicates: true });

        if (insertError) {
            console.error("[extension/intent-leads] insert error", insertError);
            return NextResponse.json({ error: "Database error" }, { status: 500, headers: cors });
        }
    }

    // Update repeat leads: increment seen_count, apply +20 boost, flag as repeated
    for (const row of repeatRows) {
        const prevCount = existingMap.get(row.fingerprint) ?? 1;
        const newScore = Math.min(100, row.lead_score + 20);
        await admin
            .from("intent_leads")
            .update({
                seen_count: prevCount + 1,
                is_repeated: true,
                lead_score: newScore,
            })
            .eq("user_id", user.id)
            .eq("fingerprint", row.fingerprint);
    }

    return NextResponse.json({ inserted: newRows.length, repeated: repeatRows.length }, { headers: cors });
}

// Called by the dashboard UI to display leads
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playbookId = searchParams.get("playbookId");
    const intentLevel = searchParams.get("intentLevel");

    let query = supabase
        .from("intent_leads")
        .select(
            "id,platform,username_or_name,bio_or_headline,profile_url,matched_text_preview,matched_keyword,source_url,captured_at,intent_level,lead_score,page_context,is_repeated,seen_count,engagement_weight"
        )
        .eq("user_id", user.id)
        .order("lead_score", { ascending: false })
        .order("captured_at", { ascending: false })
        .limit(200);

    if (playbookId) {
        query = query.eq("playbook_id", playbookId);
    }

    if (intentLevel === "high" || intentLevel === "medium" || intentLevel === "low") {
        query = query.eq("intent_level", intentLevel);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ leads: data ?? [] });
}
