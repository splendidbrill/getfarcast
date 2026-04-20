import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      subscription_status: "canceled",
    },
  });

  if (error) {
    console.error("[cancel-trial] Failed to cancel:", error);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
