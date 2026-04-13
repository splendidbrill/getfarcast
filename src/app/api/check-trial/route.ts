import { NextResponse } from "next/server";

// Global in-memory cache for used trial emails
// This reduces hits to the database for a simple, fast check
const usedTrialEmailsCache = new Set<string>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check cache first (fast path)
  if (usedTrialEmailsCache.has(normalizedEmail)) {
    return NextResponse.json({ used: true });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase
      .from("used_free_trials")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("[check-trial] Database error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (data) {
      // Add to cache
      usedTrialEmailsCache.add(normalizedEmail);
      return NextResponse.json({ used: true });
    }

    return NextResponse.json({ used: false });
  } catch (err) {
    console.error("[check-trial] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
