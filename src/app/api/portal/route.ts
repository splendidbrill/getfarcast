import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const POLAR_FALLBACK = "https://polar.sh/farcast/portal";

export async function GET() {
  const provider = process.env.PAYMENT_PROVIDER ?? "whop";

  if (provider !== "polar") {
    return NextResponse.redirect("https://whop.com/hub/");
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.redirect(process.env.POLAR_PORTAL_URL ?? POLAR_FALLBACK);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect("/");
  }

  let customerId = user.app_metadata?.polar_customer_id as string | undefined;

  if (!customerId) {
    const subscriptionId = user.app_metadata?.polar_subscription_id as string | undefined;
    if (subscriptionId) {
      try {
        const subRes = await fetch(`https://api.polar.sh/v1/subscriptions/${subscriptionId}`, {
          headers: { "Authorization": `Bearer ${accessToken}` },
        });
        if (subRes.ok) {
          const sub = await subRes.json();
          customerId = sub.customer_id as string | undefined;
        }
      } catch {
        // fall through
      }
    }
  }

  if (!customerId) {
    return NextResponse.redirect(process.env.POLAR_PORTAL_URL ?? POLAR_FALLBACK);
  }

  try {
    const res = await fetch("https://api.polar.sh/v1/customer-sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (res.ok) {
      const session = await res.json();
      if (session.customer_portal_url) {
        return NextResponse.redirect(session.customer_portal_url);
      }
    }
  } catch {
    // fall through to static URL
  }

  return NextResponse.redirect(process.env.POLAR_PORTAL_URL ?? POLAR_FALLBACK);
}
