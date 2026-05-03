import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Called after a successful Polar checkout redirect.
// Polar only appends customer_session_token to the success URL after a real payment.
export async function POST(request: Request) {
  const { token } = await request.json();

  // Basic sanity check — Polar session tokens always start with polar_cst_
  if (!token || !String(token).startsWith("polar_cst_")) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch fresh metadata so we don't lose existing fields when spreading
  const { data: { user: freshUser } } = await admin.auth.admin.getUserById(user.id);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...freshUser?.app_metadata,
      subscription_status: "active",
      subscription_end_date: endDate.toISOString(),
    },
  });

  if (error) {
    console.error("[polar-activate] Supabase update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  console.log(`[polar-activate] Activated user ${user.id} for 30 days`);
  return NextResponse.json({ ok: true });
}
