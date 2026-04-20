import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/blogAuth";

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function GET() {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await adminClient()
    .from("blog_posts")
    .select("id, title, slug, status, published_at, created_at, updated_at, excerpt, cover_image")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(request: Request) {
  const uid = await getSessionUser();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, content, excerpt, meta_title, meta_description, cover_image, status, published_at } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const db = adminClient();

  // Ensure unique slug
  let slug = slugify(title);
  const { data: existing } = await db.from("blog_posts").select("id").eq("slug", slug);
  if (existing && existing.length > 0) slug = `${slug}-${Date.now()}`;

  const { data, error } = await db
    .from("blog_posts")
    .insert({
      title,
      slug,
      content: content ?? "",
      excerpt: excerpt ?? "",
      meta_title: meta_title ?? "",
      meta_description: meta_description ?? "",
      cover_image: cover_image ?? "",
      status: status ?? "draft",
      published_at: published_at ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}
