import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkoutUrl = process.env.WHOP_CHECKOUT_URL;
  if (!checkoutUrl) {
    return NextResponse.json({ error: "Checkout not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Pass the user's email to Whop so it pre-fills checkout
  const url = new URL(checkoutUrl);
  if (user?.email) {
    url.searchParams.set("email", user.email);
  }

  return NextResponse.redirect(url.toString());
}
