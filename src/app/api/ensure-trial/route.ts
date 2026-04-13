import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Import admin client
    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get fresh user data
    const { data: adminUser } = await adminClient.auth.admin.getUserById(user.id);
    const mappedUser = (adminUser as any)?.user || adminUser;
    const appMeta = mappedUser?.app_metadata || {};
    const userMeta = mappedUser?.user_metadata || {};

    // Check if this user has already exhausted a free trial
    if (appMeta.trial_exhausted === true) {
      console.log("User has already exhausted their free trial:", user.id);
      return NextResponse.json({
        subscription_status: 'trial_exhausted',
        trial_start_date: null,
        trial_end_date: null,
        trial_canceled: true,
      });
    }

    // Check if trial needs to be set
    if (!appMeta.subscription_status || appMeta.subscription_status === 'none') {
      console.log("Setting up trial for user:", user.id);

      const trialStart = new Date().toISOString();
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...appMeta,
          subscription_status: 'on_trial',
          trial_start_date: trialStart,
          trial_end_date: trialEnd,
        },
      });

      if (updateError) {
        console.error("Failed to set trial:", updateError);
      } else {
        console.log("Trial set successfully");
        // Update local vars
        appMeta.subscription_status = 'on_trial';
        appMeta.trial_start_date = trialStart;
        appMeta.trial_end_date = trialEnd;
      }
    }

    return NextResponse.json({
      subscription_status: appMeta.subscription_status,
      trial_start_date: appMeta.trial_start_date,
      trial_end_date: appMeta.trial_end_date,
      trial_canceled: userMeta.trial_exhausted_email ? true : appMeta.trial_canceled,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}