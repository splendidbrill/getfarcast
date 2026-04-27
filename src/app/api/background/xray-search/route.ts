import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getAuthenticatedExtensionUser,
  sanitizeIntentLead,
  classifyIntentLevel,
  computeIcpBioScore,
  computeLeadScore,
  computeRecencyScore,
  computeContextScore,
  buildIntentLeadFingerprint,
} from "@/lib/extension/server";

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthenticatedExtensionUser(request as any);

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { icpQuery, platform, playbookId } = body;

    if (!icpQuery || !platform) {
      return NextResponse.json({ error: "Missing icpQuery or platform" }, { status: 400 });
    }

    let query = "";
    if (platform === "linkedin") {
      query = `site:linkedin.com/in/ "${icpQuery}"`;
    } else if (platform === "reddit") {
      query = `site:reddit.com "${icpQuery}" after:2024-01-01`;
    } else {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const serperRes = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 20 }),
    });

    if (!serperRes.ok) {
      throw new Error(`Serper API error: ${serperRes.statusText}`);
    }

    const serperData = await serperRes.json();
    const organicResults = serperData.organic || [];

    const leads = organicResults.map((result: any) => {
      const intentLevel = classifyIntentLevel(result.snippet || "");
      const recencyScore = computeRecencyScore(null); 
      const contextScore = computeContextScore(platform, null, []);
      const icpBioScore = computeIcpBioScore(result.snippet, icpQuery);
      
      const leadScore = computeLeadScore({
        intentLevel,
        recencyScore,
        contextScore,
        icpBioScore,
        engagementScore: 0,
        repeatBoost: 0,
      });

      const fingerprint = buildIntentLeadFingerprint({
        platform,
        profileUrl: result.link,
        usernameOrName: result.title || "",
        matchedKeyword: icpQuery,
      });

      return {
        ...sanitizeIntentLead({
          username_or_name: result.title || "",
          profile_url: result.link,
          matched_text_preview: result.snippet,
          matched_keyword: icpQuery,
          source_url: result.link,
        }),
        intent_level: intentLevel,
        lead_score: leadScore,
        fingerprint,
        platform,
      };
    });

    // Persist leads to the DB when a playbook is selected
    if (playbookId && leads.length > 0) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const rows = leads.map((lead: any) => ({
        user_id: user.id,
        playbook_id: playbookId,
        platform,
        lead_fingerprint: lead.fingerprint,
        intent_level: lead.intent_level,
        lead_score: lead.lead_score,
        username_or_name: lead.username_or_name,
        profile_url: lead.profile_url,
        matched_text_preview: lead.matched_text_preview,
        matched_keyword: lead.matched_keyword,
        source_url: lead.source_url,
      }));

      const fingerprints = rows.map((r: any) => r.lead_fingerprint);
      const { data: existingLeads } = await admin
        .from("intent_leads")
        .select("lead_fingerprint,seen_count")
        .eq("user_id", user.id)
        .in("lead_fingerprint", fingerprints);

      const existingMap = new Map<string, number>(
        (existingLeads ?? []).map((e: any) => [e.lead_fingerprint as string, (e.seen_count as number) ?? 1])
      );

      const newRows = rows.filter((r: any) => !existingMap.has(r.lead_fingerprint));
      const repeatRows = rows.filter((r: any) => existingMap.has(r.lead_fingerprint));

      if (newRows.length > 0) {
        const { error: insertError } = await admin.from("intent_leads").upsert(newRows, { onConflict: "user_id,lead_fingerprint", ignoreDuplicates: true });
        if (insertError) console.error("[xray-search] insert error", insertError);
      }

      for (const row of repeatRows) {
        const prevCount = existingMap.get(row.lead_fingerprint) ?? 1;
        await admin
          .from("intent_leads")
          .update({ seen_count: prevCount + 1, is_repeated: true, lead_score: Math.min(100, row.lead_score + 20) })
          .eq("user_id", user.id)
          .eq("lead_fingerprint", row.lead_fingerprint);
      }
    }

    return NextResponse.json({ leadsCount: leads.length, leads }, { status: 200 });
  } catch (err: any) {
    console.error("X-Ray Search API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
