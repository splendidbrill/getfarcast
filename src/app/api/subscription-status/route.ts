import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Always reads subscription status from the database via the admin SDK,
// bypassing JWT claims which can be stale after server-side metadata updates.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user: freshUser }, error } = await admin.auth.admin.getUserById(user.id);
  if (error || !freshUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    subscription_status: freshUser.app_metadata?.subscription_status ?? null,
    trial_end_date: freshUser.app_metadata?.trial_end_date ?? null,
    subscription_end_date: freshUser.app_metadata?.subscription_end_date ?? null,
  });
}
