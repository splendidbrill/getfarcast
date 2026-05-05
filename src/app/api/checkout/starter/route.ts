import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = process.env.PAYMENT_PROVIDER ?? "whop";

  const checkoutUrl =
    provider === "polar"
      ? process.env.POLAR_CHECKOUT_URL
      : process.env.WHOP_CHECKOUT_URL;

  if (!checkoutUrl) {
    return NextResponse.json({ error: "Checkout not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(checkoutUrl);
  if (user?.email) {
    // Whop uses "email"; Polar uses "prefill_email"
    const emailParam = provider === "polar" ? "prefill_email" : "email";
    url.searchParams.set(emailParam, user.email);
  }

  if (provider === "polar") {
    url.searchParams.set("discount_code", "GETONEMONTH");
  }

  return NextResponse.redirect(url.toString());
}
