import { PostForm } from "@/components/blog/PostForm";
import { createClient } from "@supabase/supabase-js";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await admin.from("blog_posts").select("*").eq("id", id).single();

  if (!data) {
    return (
      <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
        <p className="text-gray-400">Post not found.</p>
      </div>
    );
  }

  return (
    <PostForm
      initial={{
        id: data.id,
        title: data.title ?? "",
        content: data.content ?? "",
        excerpt: data.excerpt ?? "",
        meta_title: data.meta_title ?? "",
        meta_description: data.meta_description ?? "",
        cover_image: data.cover_image ?? "",
        status: data.status ?? "draft",
        published_at: data.published_at ?? "",
      }}
    />
  );
}
