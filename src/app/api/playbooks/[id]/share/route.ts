import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: playbook } = await admin
    .from("playbooks")
    .select("id, share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!playbook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let shareToken = playbook.share_token as string | null;

  if (!shareToken) {
    shareToken = randomUUID();
    const { error: updateError } = await admin
      .from("playbooks")
      .update({ share_token: shareToken })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
    }
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  const shareUrl = `${origin}/share/${shareToken}`;

  return NextResponse.json({ shareToken, shareUrl });
}
