import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
    buildIntentLeadFingerprint,
    getAuthenticatedExtensionUser,
    getExtensionCorsHeaders,
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

    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.leads) || !body.platform || !body.playbook_id) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: cors });
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rows = (body.leads as RawLead[])
        .filter((l) => l.username_or_name && l.profile_url)
        .map((lead) => {
            const sanitized = sanitizeIntentLead(lead);
            const fingerprint = buildIntentLeadFingerprint({
                platform: body.platform,
                profileUrl: sanitized.profile_url,
                usernameOrName: sanitized.username_or_name,
                matchedKeyword: sanitized.matched_keyword ?? "",
            });

            return {
                user_id: user.id,
                playbook_id: body.playbook_id,
                platform: body.platform,
                fingerprint,
                ...sanitized,
            };
        });

    if (rows.length === 0) {
        return NextResponse.json({ inserted: 0 }, { headers: cors });
    }

    const { error: insertError } = await admin
        .from("intent_leads")
        .upsert(rows, { onConflict: "user_id,fingerprint", ignoreDuplicates: true });

    if (insertError) {
        console.error("[extension/intent-leads] insert error", insertError);
        return NextResponse.json({ error: "Database error" }, { status: 500, headers: cors });
    }

    return NextResponse.json({ inserted: rows.length }, { headers: cors });
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

    let query = supabase
        .from("intent_leads")
        .select("id,platform,username_or_name,bio_or_headline,profile_url,matched_text_preview,matched_keyword,source_url,captured_at")
        .eq("user_id", user.id)
        .order("captured_at", { ascending: false })
        .limit(200);

    if (playbookId) {
        query = query.eq("playbook_id", playbookId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ leads: data ?? [] });
}
