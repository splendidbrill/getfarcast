import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getCustomer, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${req.nextUrl.origin}/`);
    }

    const customerId = user.app_metadata?.lemonsqueezy_customer_id;
    if (!customerId) {
        return NextResponse.redirect(`${req.nextUrl.origin}/dashboard?error=no_subscription`);
    }

    lemonSqueezySetup({
      apiKey: process.env.LEMON_SQUEEZY_API_KEY || "",
      onError: (error) => console.error("Lemon Squeezy API Error:", error),
    });

    const customerNode = await getCustomer(customerId);

    const portalUrl = customerNode?.data?.data?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
       return NextResponse.redirect(`${req.nextUrl.origin}/dashboard?error=portal_unavailable`);
    }

    return NextResponse.redirect(portalUrl);

  } catch (err) {
      console.error(err);
      return NextResponse.redirect(`${req.nextUrl.origin}/dashboard?error=server_error`);
  }
}
