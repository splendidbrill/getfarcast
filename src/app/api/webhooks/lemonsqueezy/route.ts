import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";
    
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Ensure we handle all subscription events (created, updated, cancelled, expired, etc.)
    if (event.meta.event_name.startsWith("subscription_")) {
      const customData = event.meta.custom_data;
      if (!customData || !customData.user_id) {
        return NextResponse.json({ error: "No user_id found in custom_data" }, { status: 400 });
      }

      const userId = customData.user_id;
      const status = event.data.attributes.status;
      const lsCustomerId = event.data.attributes.customer_id;
      const variantId = event.data.attributes.variant_id;

      let planName = "Starter"; // Default Since we only have Starter right now

      // Supabase Service Role client to update user
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          subscription_status: status, // "on_trial", "active", "past_due", "canceled"
          lemonsqueezy_customer_id: lsCustomerId,
          plan: planName,
        },
      });

      if (error) {
        console.error("Failed to update user app_metadata:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
