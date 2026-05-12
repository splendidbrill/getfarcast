import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getAuthenticatedExtensionUser,
  sanitizeIntentLead,
  buildIntentLeadFingerprint,
  computeLeadScore,
  computeIcpBioScore,
  classifyIntentLevel,
} from "@/lib/extension/server";
import { checkAndIncrementUsage } from "@/lib/usage";

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthenticatedExtensionUser(request as any);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { platform, playbookId } = body;

    if (!platform || !playbookId) {
      return NextResponse.json({ error: "Missing platform or playbookId" }, { status: 400 });
    }
    if (platform !== "linkedin" && platform !== "twitter_x") {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: playbookRecord } = await admin
      .from("playbooks")
      .select("data")
      .eq("id", playbookId)
      .eq("user_id", user.id)
      .single();

    if (!playbookRecord) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    const data = (playbookRecord.data ?? {}) as Record<string, unknown>;
    const pb = (data.playbook ?? {}) as Record<string, unknown>;
    const icp = (pb.icp ?? {}) as Record<string, unknown>;
    const demographics = (icp.demographics ?? {}) as Record<string, unknown>;

    const jobTitles: string[] = Array.isArray(demographics.jobTitles)
      ? (demographics.jobTitles as string[]).filter(Boolean).slice(0, 5)
      : [];
    const location: string = typeof demographics.location === "string" ? demographics.location.trim() : "";
    const icpSummary: string = typeof icp.summary === "string" ? icp.summary : "";

    if (jobTitles.length === 0) {
      return NextResponse.json({ leadsCount: 0, leads: [], reason: "No ICP job titles configured" });
    }

    const usageCheck = await checkAndIncrementUsage(user.id, "leads", jobTitles.length * 10);
    if (!usageCheck.allowed) {
      return NextResponse.json({ error: usageCheck.error }, { status: 403 });
    }

    // Fetch all profile URLs already seen for this user+platform (permanent dedup, no date filter)
    const { data: existingProfiles } = await admin
      .from("intent_leads")
      .select("profile_url")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .not("profile_url", "is", null);

    const seenUrls = new Set<string>(
      (existingProfiles ?? []).map((r: any) => String(r.profile_url).toLowerCase().trim())
    );

    const allLeads: Record<string, unknown>[] = [];

    for (const jobTitle of jobTitles.slice(0, 4)) {
      const query = buildQuery(platform, jobTitle, location);

      try {
        const serperRes = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query, num: 10 }),
        });

        if (!serperRes.ok) continue;

        const serperData = await serperRes.json();
        const results: any[] = serperData.organic ?? [];

        for (const result of results) {
          const profileUrl = extractProfileUrl(platform, result.link ?? "");
          if (!profileUrl) continue;

          const normalized = profileUrl.toLowerCase();
          if (seenUrls.has(normalized)) continue;
          seenUrls.add(normalized);

          const snippet: string = result.snippet ?? "";
          const title: string = result.title ?? "";
          const intentLevel = classifyIntentLevel(snippet);
          const icpBioScore = computeIcpBioScore(snippet || title, icpSummary);
          const leadScore = computeLeadScore({
            intentLevel,
            recencyScore: 0,
            contextScore: 5,
            icpBioScore,
          });

          const fingerprint = buildIntentLeadFingerprint({
            platform: platform as "linkedin" | "twitter_x",
            profileUrl,
            usernameOrName: title,
            matchedKeyword: jobTitle,
          });

          allLeads.push({
            user_id: user.id,
            playbook_id: playbookId,
            platform,
            lead_fingerprint: fingerprint,
            intent_level: intentLevel,
            lead_score: leadScore,
            ...sanitizeIntentLead({
              username_or_name: extractName(title, platform),
              bio_or_headline: snippet || undefined,
              profile_url: profileUrl,
              matched_keyword: jobTitle,
              source_url: result.link ?? "",
            }),
            page_context: "profile_search",
          });
        }
      } catch {
        continue;
      }
    }

    const topLeads = allLeads
      .sort((a, b) => ((b.lead_score as number) ?? 0) - ((a.lead_score as number) ?? 0))
      .slice(0, 30);

    if (topLeads.length > 0) {
      await admin.from("intent_leads").upsert(topLeads, {
        onConflict: "user_id,lead_fingerprint",
        ignoreDuplicates: true,
      });
    }

    return NextResponse.json({ leadsCount: topLeads.length, leads: topLeads });
  } catch (err: any) {
    console.error("[profile-leads] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildQuery(platform: string, jobTitle: string, location: string): string {
  if (platform === "linkedin") {
    const base = `site:linkedin.com/in/ "${jobTitle}"`;
    return location ? `${base} "${location}"` : base;
  }
  // twitter_x — exclude tweet pages and non-profile paths
  const base = `site:twitter.com "${jobTitle}" -inurl:status -inurl:hashtag -inurl:search`;
  return location ? `${base} "${location}"` : base;
}

function extractProfileUrl(platform: string, link: string): string | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    if (platform === "linkedin") {
      if (!url.pathname.startsWith("/in/")) return null;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "in") {
        return `https://www.linkedin.com/in/${parts[1]}`;
      }
      return null;
    }
    // twitter_x
    if (url.hostname !== "twitter.com" && url.hostname !== "x.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    // Profile = exactly one segment, not a reserved path
    if (parts.length === 1 && !["i", "hashtag", "search", "home", "explore"].includes(parts[0])) {
      return `https://twitter.com/${parts[0]}`;
    }
    return null;
  } catch {
    return null;
  }
}

function extractName(title: string, platform: string): string {
  if (platform === "linkedin") {
    return title.split(" - ")[0]?.trim() || title;
  }
  // twitter: "Name (@handle)" or "Name / X" or "Name on X:"
  return title.split(" (@")[0]?.split(" / ")[0]?.split(" on X")[0]?.trim() || title;
}
