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
  isSellerLead,
} from "@/lib/extension/server";
import { checkAndIncrementUsage } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthenticatedExtensionUser(request as any);

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { icpQuery, platform, playbookId, jobTitles } = body;
    const icpJobTitles: string[] = Array.isArray(jobTitles) ? jobTitles.filter((t: unknown) => typeof t === "string" && t.trim()) : [];

    if (!icpQuery || !platform) {
      return NextResponse.json({ error: "Missing icpQuery or platform" }, { status: 400 });
    }

    let query = "";
    if (platform === "linkedin") {
      if (icpJobTitles.length > 0) {
        const titleFilter = icpJobTitles.slice(0, 3).map((t: string) => `"${t}"`).join(" OR ");
        query = `site:linkedin.com/posts/ (${titleFilter}) "${icpQuery}"`;
      } else {
        query = `site:linkedin.com/posts/ "${icpQuery}"`;
      }
    } else if (platform === "reddit") {
      query = `site:reddit.com ${icpQuery}`;
    } else if (platform === "twitter_x") {
      query = `(site:twitter.com OR site:x.com) ${icpQuery} -inurl:hashtag`;
    } else {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    // Attempt to increment leads usage by 20 (max expected results from Serper)
    const usageCheck = await checkAndIncrementUsage(user.id, "leads", 20);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.error }, { status: 403 });
    }

    const serperRes = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 20, tbs: "qdr:m" }),
    });

    if (!serperRes.ok) {
      throw new Error(`Serper API error: ${serperRes.statusText}`);
    }

    const serperData = await serperRes.json();
    const organicResults = serperData.organic || [];

    const filteredResults = organicResults.filter((result: any) => !isSellerLead(result.snippet));

    const leads = filteredResults.map((result: any) => {
      const link: string = result.link || "";

      // For LinkedIn posts, derive the profile URL from the post URL.
      // Post URL format: linkedin.com/posts/{username}_{description}-activity-{id}
      let profileUrl = link;
      let sourceUrl = link;
      if (platform === "linkedin" && link.includes("linkedin.com/posts/")) {
        sourceUrl = link;
        try {
          const postPath = new URL(link).pathname;
          const match = postPath.match(/^\/posts\/([^_]+)/);
          if (match?.[1]) profileUrl = `https://www.linkedin.com/in/${match[1]}`;
        } catch {
          profileUrl = link;
        }
      } else if (platform === "twitter_x") {
        sourceUrl = link;
        try {
          const tweetUrl = new URL(link);
          const parts = tweetUrl.pathname.split("/").filter(Boolean);
          // Both tweet URLs (username/status/id) and profile URLs (username) — extract the username
          if (parts.length >= 1 && !["i", "hashtag", "search"].includes(parts[0])) {
            profileUrl = `https://twitter.com/${parts[0]}`;
          }
        } catch {
          profileUrl = link;
        }
      }

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
        profileUrl,
        usernameOrName: result.title || "",
        matchedKeyword: icpQuery,
      });

      return {
        ...sanitizeIntentLead({
          username_or_name: result.title || "",
          profile_url: profileUrl,
          matched_text_preview: result.snippet,
          matched_keyword: icpQuery,
          source_url: sourceUrl,
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
