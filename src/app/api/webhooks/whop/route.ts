import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Verifies the Whop webhook signature using HMAC-SHA256
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const expected = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[whop-webhook] WHOP_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("whop-signature") ?? "";

  if (!verifySignature(rawBody, signature, secret)) {
    console.warn("[whop-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { action: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, data } = event;

  // Whop passes the user's email in the membership object (try multiple paths)
  const email = (
    data?.email ??
    data?.user_email ??
    (data?.user as Record<string, unknown>)?.email ??
    ""
  ) as string;
  const whopUserId = (data?.whop_user_id ?? data?.user_id ?? "") as string;

  if (!email && !whopUserId) {
    console.warn("[whop-webhook] No user identifier in event:", action);
    return NextResponse.json({ ok: true });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up Supabase user by email
  const { data: { users }, error: lookupError } = await admin.auth.admin.listUsers();
  if (lookupError) {
    console.error("[whop-webhook] User lookup failed:", lookupError);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const supaUser = users.find((u) => u.email === email);
  if (!supaUser) {
    // User hasn't signed up yet — nothing to update
    console.log("[whop-webhook] No Supabase user found for email:", email);
    return NextResponse.json({ ok: true });
  }

  let newStatus: string | null = null;
  let subscriptionEndDate: string | null = null;

  if (action === "membership.went_valid") {
    newStatus = "active";
    // Use Whop's renewal_period_end if provided, otherwise default to 30 days
    const renewalEnd = data?.renewal_period_end as number | undefined;
    if (renewalEnd) {
      subscriptionEndDate = new Date(renewalEnd * 1000).toISOString();
    } else {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscriptionEndDate = endDate.toISOString();
    }
  } else if (action === "membership.went_invalid") {
    newStatus = "canceled";
  }

  if (newStatus) {
    const { error: updateError } = await admin.auth.admin.updateUserById(supaUser.id, {
      app_metadata: {
        ...supaUser.app_metadata,
        subscription_status: newStatus,
        whop_membership_id: data?.id ?? null,
        ...(subscriptionEndDate !== null && { subscription_end_date: subscriptionEndDate }),
      },
    });

    if (updateError) {
      console.error("[whop-webhook] Update failed:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    console.log(`[whop-webhook] ${action} → user ${supaUser.id} status set to ${newStatus}`);
  }

  return NextResponse.json({ ok: true });
}
