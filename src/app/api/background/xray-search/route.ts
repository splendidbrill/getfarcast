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
    const { supabase, user, error } = await getAuthenticatedExtensionUser(request as any);

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { icpQuery, platform } = body;

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

    return NextResponse.json({ leadsCount: leads.length, leads }, { status: 200 });
  } catch (err: any) {
    console.error("X-Ray Search API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
