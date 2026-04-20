import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { signSession, COOKIE } from "@/lib/blogAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("blog_admin")
    .select("id, password")
    .eq("username", username)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Support both bcrypt hashes and plain-text passwords
  const stored: string = data.password;
  const valid = stored.startsWith("$2")
    ? await bcrypt.compare(password, stored)
    : stored === password;

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession(data.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
