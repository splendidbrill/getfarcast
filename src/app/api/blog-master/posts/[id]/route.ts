import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/blogAuth";
import { deleteImageFromS3 } from "@/lib/s3";

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await adminClient()
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { data, error } = await adminClient()
    .from("blog_posts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = adminClient();

  // Collect all image URLs from content and cover before deleting
  const { data: post } = await db
    .from("blog_posts")
    .select("content, cover_image")
    .eq("id", id)
    .single();

  if (post) {
    const srcs: string[] = [];
    const imgRegex = /src="([^"]+)"/g;
    let m;
    while ((m = imgRegex.exec(post.content ?? "")) !== null) srcs.push(m[1]);
    if (post.cover_image) srcs.push(post.cover_image);
    await Promise.allSettled(srcs.map(deleteImageFromS3));
  }

  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
