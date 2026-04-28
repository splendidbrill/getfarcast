import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Returns per-playbook lead counts for the dashboard badges
// { counts: { [playbookId]: { hot: number; warm: number; total: number } } }
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from("intent_leads")
        .select("playbook_id,intent_level")
        .eq("user_id", user.id)
        .or(`posted_at.gte.${thirtyDaysAgo},and(posted_at.is.null,created_at.gte.${thirtyDaysAgo})`)
        .limit(2000);

    if (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const counts: Record<string, { hot: number; warm: number; total: number }> = {};

    for (const row of data ?? []) {
        const pid = row.playbook_id as string;
        if (!counts[pid]) counts[pid] = { hot: 0, warm: 0, total: 0 };
        counts[pid].total++;
        if (row.intent_level === "high") counts[pid].hot++;
        if (row.intent_level === "medium") counts[pid].warm++;
    }

    return NextResponse.json({ counts });
}
