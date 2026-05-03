import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Called after a successful Polar checkout redirect.
// Verifies the customer_session_token with Polar's API and activates the user.
export async function POST(request: Request) {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 400 });
  }

  // Determine sandbox vs production from the checkout URL
  const polarBase = (process.env.POLAR_CHECKOUT_URL ?? "").includes("sandbox")
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";

  // Verify token and get customer details from Polar
  const polarRes = await fetch(`${polarBase}/v1/customers/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!polarRes.ok) {
    console.error("[polar-activate] Polar API error:", polarRes.status);
    return NextResponse.json({ error: "Polar verification failed" }, { status: 400 });
  }

  const customer = await polarRes.json();
  const email = customer?.email as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "No email from Polar" }, { status: 400 });
  }

  // Make sure the logged-in user matches the Polar customer email
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== email) {
    return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
  }

  // Activate the user for 30 days
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      subscription_status: "active",
      subscription_end_date: endDate.toISOString(),
    },
  });

  if (error) {
    console.error("[polar-activate] Supabase update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  console.log(`[polar-activate] Activated user ${user.id} via customer_session_token`);
  return NextResponse.json({ ok: true });
}
