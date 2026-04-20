import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const TRIAL_DAYS = 14;

// Called when the JWT is stale and we need to confirm/assign trial status.
// Creates a trial for new users; returns current status for existing ones.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = user.app_metadata?.subscription_status;

  // Already has a status — return it
  if (current && current !== "none") {
    return NextResponse.json({
      subscription_status: current,
      trial_end_date: user.app_metadata?.trial_end_date ?? null,
    });
  }

  // New user — assign a 14-day trial
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      subscription_status: "on_trial",
      trial_end_date: trialEndDate.toISOString(),
    },
  });

  if (error) {
    console.error("[ensure-trial] Failed to set trial:", error);
    return NextResponse.json({ error: "Failed to set trial" }, { status: 500 });
  }

  return NextResponse.json({
    subscription_status: "on_trial",
    trial_end_date: trialEndDate.toISOString(),
  });
}
