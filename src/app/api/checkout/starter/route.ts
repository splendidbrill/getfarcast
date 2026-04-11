import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = user.app_metadata?.subscription_status;
    if (status === "active" || status === "on_trial") {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/dashboard`);
    }

    lemonSqueezySetup({
      apiKey: process.env.LEMON_SQUEEZY_API_KEY || "",
      onError: (error) => console.error("Lemon Squeezy API Error:", error),
    });

    const storeId = parseInt(process.env.LEMON_SQUEEZY_STORE_ID || "0", 10);
    const variantId = parseInt(process.env.LEMON_SQUEEZY_VARIANT_ID || "0", 10);

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
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/dashboard`,
        receiptButtonText: 'Go to Dashboard',
        receiptLinkUrl: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/dashboard`
      },
    });

    if (error) {
      console.error("Create checkout error:", error);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    if (!data?.data?.attributes?.url) {
      return NextResponse.json({ error: "Failed to get checkout URL" }, { status: 500 });
    }

    // Redirect the user to the Lemon Squeezy checkout page
    return NextResponse.redirect(data.data.attributes.url);
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
