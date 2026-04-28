import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// One-time migration: ensures all on_trial users have at least 7 days remaining.
// Only callable by admin (admin.oriflow@gmail.com).
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "admin.oriflow@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const minEnd = new Date();
  minEnd.setDate(minEnd.getDate() + 7);

  let page = 1;
  let updated = 0;
  let skipped = 0;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) break;

    for (const u of data.users) {
      if (u.app_metadata?.subscription_status !== "on_trial") continue;

      const existingEnd = u.app_metadata?.trial_end_date
        ? new Date(u.app_metadata.trial_end_date)
        : null;

      if (existingEnd && existingEnd >= minEnd) {
        skipped++;
        continue;
      }

      await admin.auth.admin.updateUserById(u.id, {
        app_metadata: {
          ...u.app_metadata,
          trial_end_date: minEnd.toISOString(),
        },
      });
      updated++;
    }

    if (data.users.length < 100) break;
    page++;
  }

  return NextResponse.json({ updated, skipped });
}
