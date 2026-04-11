import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export async function GET(req: NextRequest) {
  try {
    console.log("[checkout/starter] Request received");

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("[checkout/starter] Auth error:", userError.message);
    }

    if (!user) {
      console.log("[checkout/starter] No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[checkout/starter] User found:", user.id, "email:", user.email);

    const status = user.app_metadata?.subscription_status;
    console.log("[checkout/starter] Subscription status:", status);

    if (status === "active" || status === "on_trial") {
      console.log("[checkout/starter] Already subscribed - redirecting to dashboard");
      return NextResponse.redirect(`${req.nextUrl.origin}/dashboard`);
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeIdRaw = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantIdRaw = process.env.LEMON_SQUEEZY_VARIANT_ID;

    console.log("[checkout/starter] Env check - apiKey present:", !!apiKey, "storeId:", storeIdRaw, "variantId:", variantIdRaw);

    if (!apiKey || !storeIdRaw || !variantIdRaw) {
      console.error("[checkout/starter] Missing env variables!");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    lemonSqueezySetup({
      apiKey,
      onError: (error) => console.error("[checkout/starter] Lemon Squeezy SDK Error:", error),
    });

    const storeId = parseInt(storeIdRaw, 10);
    const variantId = parseInt(variantIdRaw, 10);

    console.log("[checkout/starter] Calling createCheckout with storeId:", storeId, "variantId:", variantId);

    const { data, error } = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: user.email ?? undefined,
        custom: {
          user_id: user.id,
        },
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
      },
      productOptions: {
        enabledVariants: [variantId],
        redirectUrl: `${req.nextUrl.origin}/dashboard`,
        receiptButtonText: 'Go to Dashboard',
        receiptLinkUrl: `${req.nextUrl.origin}/dashboard`,
      },
    });

    if (error) {
      console.error("[checkout/starter] createCheckout error:", JSON.stringify(error));
      return NextResponse.json({ error: "Failed to create checkout", detail: error }, { status: 500 });
    }

    const checkoutUrl = data?.data?.attributes?.url;
    console.log("[checkout/starter] Checkout URL:", checkoutUrl);

    if (!checkoutUrl) {
      console.error("[checkout/starter] No checkout URL in response:", JSON.stringify(data));
      return NextResponse.json({ error: "Failed to get checkout URL" }, { status: 500 });
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    console.error("[checkout/starter] Unhandled exception:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: String(error) }, { status: 500 });
  }
}
