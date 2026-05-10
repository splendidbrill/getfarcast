import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: playbookRow } = await admin
    .from("playbooks")
    .select("id, user_id")
    .eq("share_token", token)
    .single();

  if (!playbookRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: allLeads } = await admin
    .from("intent_leads")
    .select(
      "id,platform,username_or_name,bio_or_headline,profile_url,matched_text_preview,matched_keyword,source_url,created_at,intent_level,lead_score,page_context,is_repeated,seen_count"
    )
    .eq("user_id", playbookRow.user_id)
    .eq("playbook_id", playbookRow.id)
    .gte("created_at", thirtyDaysAgo)
    .order("lead_score", { ascending: false })
    .order("created_at", { ascending: false });

  const leads = allLeads ?? [];

  const counts = {
    twitter_x: leads.filter((l) => l.platform === "twitter_x").length,
    linkedin: leads.filter((l) => l.platform === "linkedin").length,
    reddit: leads.filter((l) => l.platform === "reddit").length,
  };

  // Return only the top 1 lead per platform for the public view
  const visibleLeads: typeof leads = [];
  for (const platform of ["twitter_x", "linkedin", "reddit"]) {
    const lead = leads.find((l) => l.platform === platform);
    if (lead) visibleLeads.push(lead);
  }

  return NextResponse.json({ leads: visibleLeads, counts });
}
