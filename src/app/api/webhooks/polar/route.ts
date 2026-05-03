import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, headers: Headers, secret: string): boolean {
  // Polar/Svix sends either svix-* or webhook-* headers depending on configuration
  const webhookId = headers.get("webhook-id") ?? headers.get("svix-id");
  const webhookTimestamp = headers.get("webhook-timestamp") ?? headers.get("svix-timestamp");
  const webhookSignature = headers.get("webhook-signature") ?? headers.get("svix-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const secretBytes = Buffer.from(secret, "utf8");
  const expectedBytes = crypto.createHmac("sha256", secretBytes).update(signedContent).digest();

  // Compare decoded bytes — handles any base64 encoding variations
  return webhookSignature.split(" ").some((sig) => {
    const parts = sig.split(",");
    if (parts[0] !== "v1" || !parts[1]) return false;
    try {
      return crypto.timingSafeEqual(expectedBytes, Buffer.from(parts[1], "base64"));
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[polar-webhook] POLAR_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers, secret)) {
    console.warn("[polar-webhook] Invalid signature");
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
