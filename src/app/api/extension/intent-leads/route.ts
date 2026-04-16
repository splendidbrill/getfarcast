import { NextResponse, type NextRequest } from "next/server";

import {
  buildIntentLeadFingerprint,
  getAuthenticatedExtensionUser,
  getExtensionCorsHeaders,
  sanitizeIntentLead,
} from "@/lib/extension/server";

type IntentLeadsRequestBody = {
  user_id?: string;
  playbook_id?: string;
  platform?: "twitter_x" | "reddit" | "linkedin";
  leads?: Array<{
    username_or_name?: string;
    bio_or_headline?: string;
    profile_url?: string;
    matched_text_preview?: string;
    matched_keyword?: string;
    source_url?: string;
    posted_at?: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getExtensionCorsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedExtensionUser(request);

  if (!user) {
    return NextResponse.json(
      { error: error ?? "Unauthorized" },
      {
        status: 401,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  const body = (await request.json().catch(() => null)) as IntentLeadsRequestBody | null;

  if (!body?.playbook_id || !body?.platform || !Array.isArray(body.leads)) {
    return NextResponse.json(
      { error: "Invalid payload" },
      {
        status: 400,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  if (body.user_id && body.user_id !== user.id) {
    return NextResponse.json(
      { error: "user_id does not match authenticated user" },
      {
        status: 403,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  const rows = body.leads
    .map((lead) =>
      sanitizeIntentLead({
        username_or_name: lead.username_or_name ?? "",
        bio_or_headline: lead.bio_or_headline,
        profile_url: lead.profile_url ?? "",
        matched_text_preview: lead.matched_text_preview,
        matched_keyword: lead.matched_keyword,
        source_url: lead.source_url,
        posted_at: lead.posted_at,
      })
    )
    .filter(
      (lead) =>
        lead.username_or_name.length > 0 &&
        lead.profile_url.length > 0 &&
        lead.matched_keyword.length > 0 &&
        lead.source_url.length > 0
    )
    .map((lead) => ({
      user_id: user.id,
      playbook_id: body.playbook_id as string,
      platform: body.platform as "twitter_x" | "reddit" | "linkedin",
      username_or_name: lead.username_or_name,
      bio_or_headline: lead.bio_or_headline,
      profile_url: lead.profile_url,
      matched_text_preview: lead.matched_text_preview,
      matched_keyword: lead.matched_keyword,
      source_url: lead.source_url,
      posted_at: lead.posted_at,
      intent_score: null,
      lead_fingerprint: buildIntentLeadFingerprint({
        platform: body.platform as "twitter_x" | "reddit" | "linkedin",
        profileUrl: lead.profile_url,
        usernameOrName: lead.username_or_name,
        matchedKeyword: lead.matched_keyword,
      }),
      raw_payload: lead,
    }));

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid intent leads provided" },
      {
        status: 400,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  // TODO: Gemini 1.5 Intent Verification Hook

  const { data, error: insertError } = await supabase
    .from("intent_leads")
    .upsert(rows, {
      onConflict: "user_id,lead_fingerprint",
    })
    .select("id, lead_fingerprint");

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      {
        status: 500,
        headers: getExtensionCorsHeaders(),
      }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      saved: data?.length ?? rows.length,
    },
    {
      status: 200,
      headers: getExtensionCorsHeaders(),
    }
  );
}