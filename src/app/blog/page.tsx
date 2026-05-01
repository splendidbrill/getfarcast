import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — GetFarcast",
  description: "Founder growth tactics, distribution playbooks, and real stories from early-stage builders.",
  openGraph: {
    title: "Blog — GetFarcast",
    description: "Founder growth tactics, distribution playbooks, and real stories from early-stage builders.",
    url: "https://www.getfarcast.com/blog",
  },
  alternates: { canonical: "https://www.getfarcast.com/blog" },
};

async function getPosts() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await db
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, published_at, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return data ?? [];
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <main className="bg-[#faf8f6] min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-6 pt-32 pb-24 flex-1">
        <div className="mb-14">
          <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a2e] tracking-tight mb-4">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]">GetFarcast</span> Blog
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl">
            Founder growth tactics, distribution playbooks, and real stories from early-stage builders.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-400">No posts yet.</p>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md hover:border-[#ff6b4e]/20 transition-all overflow-hidden flex flex-col sm:flex-row"
              >
                {post.cover_image && (
                  <div className="sm:w-52 shrink-0">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-48 sm:h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  {post.published_at && (
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                      })}
                    </p>
                  )}
                  <h2 className="text-xl font-bold text-[#1a1a2e] group-hover:text-[#ff6b4e] transition-colors mb-2 leading-snug">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">{post.excerpt}</p>
                  )}
                  <span className="mt-4 text-sm font-bold text-[#ff6b4e]">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
