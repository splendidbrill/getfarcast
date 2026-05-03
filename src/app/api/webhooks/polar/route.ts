import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "standardwebhooks";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[polar-webhook] POLAR_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const webhookId = request.headers.get("webhook-id") ?? "";
  const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
  const webhookSignature = request.headers.get("webhook-signature") ?? "";

  try {
    // standardwebhooks expects the secret WITHOUT the "polar_whs_" prefix, base64-encoded
    const wh = new Webhook(secret.replace(/^polar_whs_/, ""));
    wh.verify(rawBody, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    });
  } catch (err) {
    console.warn("[polar-webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = event;

  // Polar webhook payload varies by event type — cover all known paths
  const email = (
    (data?.user as Record<string, unknown>)?.email ??
    (data?.customer as Record<string, unknown>)?.email ??
    (data?.billing_address as Record<string, unknown>)?.email ??
    data?.user_email ??
    data?.email ??
    ""
  ) as string;

  if (!email) {
    console.warn("[polar-webhook] No email in event:", type);
    return NextResponse.json({ ok: true });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { users }, error: lookupError } = await admin.auth.admin.listUsers();
  if (lookupError) {
    console.error("[polar-webhook] User lookup failed:", lookupError);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const supaUser = users.find((u) => u.email === email);
  if (!supaUser) {
    console.log("[polar-webhook] No Supabase user found for email:", email);
    return NextResponse.json({ ok: true });
  }

  let newStatus: string | null = null;
  let subscriptionEndDate: string | null = null;

  if (
    type === "subscription.active" ||
    type === "subscription.created" ||
    type === "order.created"
  ) {
    newStatus = "active";
    const currentPeriodEnd = data?.current_period_end as string | undefined;
    if (currentPeriodEnd) {
      subscriptionEndDate = new Date(currentPeriodEnd).toISOString();
    } else {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscriptionEndDate = endDate.toISOString();
    }
  } else if (type === "subscription.canceled" || type === "subscription.revoked") {
    newStatus = "canceled";
  }

  if (newStatus) {
    const { error: updateError } = await admin.auth.admin.updateUserById(supaUser.id, {
      app_metadata: {
        ...supaUser.app_metadata,
        subscription_status: newStatus,
        polar_subscription_id: data?.id ?? null,
        ...(subscriptionEndDate !== null && { subscription_end_date: subscriptionEndDate }),
      },
    });

    if (updateError) {
      console.error("[polar-webhook] Update failed:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    console.log(`[polar-webhook] ${type} → user ${supaUser.id} status set to ${newStatus}`);
  }

  return NextResponse.json({ ok: true });
}
