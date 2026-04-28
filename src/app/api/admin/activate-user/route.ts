import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Manually activates a user by email. Only callable by admin.
// POST body: { "email": "user@example.com" }
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "admin.oriflow@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let targetEmail: string;
  try {
    const body = await request.json();
    targetEmail = body.email?.trim().toLowerCase();
    if (!targetEmail) throw new Error("missing email");
  } catch {
    return NextResponse.json({ error: "Body must be JSON with an email field" }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { users }, error: lookupError } = await admin.auth.admin.listUsers();
  if (lookupError) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const targetUser = users.find((u) => u.email?.toLowerCase() === targetEmail);
  if (!targetUser) {
    return NextResponse.json({ error: `No user found with email: ${targetEmail}` }, { status: 404 });
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, {
    app_metadata: {
      ...targetUser.app_metadata,
      subscription_status: "active",
      subscription_end_date: endDate.toISOString(),
    },
  });

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: targetEmail,
    subscription_end_date: endDate.toISOString(),
  });
}
