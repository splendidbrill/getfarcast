import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, reason = "canceled" } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert - insert or ignore if already exists
    const { error } = await supabase
      .from("used_free_trials")
      .upsert(
        { email: normalizedEmail, reason },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) {
      console.error("[record-trial] Failed to record trial:", error);
      return NextResponse.json({ error: "Failed to record trial" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[record-trial] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
