import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

async function getPost(slug: string) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await db
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not Found" };

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || "";
  const url = `https://getfarcast.com/blog/${post.slug}`;

  return {
    title: `${title} — GetFarcast Blog`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      siteName: "GetFarcast",
      images: post.cover_image ? [{ url: post.cover_image, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image ? [post.cover_image] : [],
    },
    alternates: { canonical: url },
  };
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: { "@type": "Organization", name: "GetFarcast", url: "https://getfarcast.com" },
    publisher: {
      "@type": "Organization",
      name: "GetFarcast",
      url: "https://getfarcast.com",
      logo: { "@type": "ImageObject", url: "https://getfarcast.com/favicon.ico" },
    },
    url: `https://getfarcast.com/blog/${post.slug}`,
    ...(post.cover_image ? { image: post.cover_image } : {}),
  };

  return (
    <main className="bg-[#faf8f6] min-h-screen flex flex-col">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover image */}
      {post.cover_image && (
        <div className="w-full h-72 sm:h-96 overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <article className="max-w-3xl mx-auto w-full px-6 pt-12 pb-24 flex-1">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-[#ff6b4e] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> All posts
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-400 font-medium">
            {post.published_at && (
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </time>
            )}
            <span>·</span>
            <span>{readingTime(post.content)} min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1a1a2e] leading-tight tracking-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-lg text-gray-500 font-medium leading-relaxed">{post.excerpt}</p>
          )}
        </header>

        <div
          className="prose prose-lg max-w-none
            prose-headings:font-black prose-headings:text-[#1a1a2e] prose-headings:tracking-tight
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-[#ff6b4e] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#1a1a2e]
            prose-blockquote:border-l-[#ff6b4e] prose-blockquote:text-gray-600
            prose-code:text-[#ff6b4e] prose-code:bg-[#ff6b4e]/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
            prose-pre:bg-[#1a1a2e] prose-pre:text-gray-100
            prose-img:rounded-2xl prose-img:shadow-md
            prose-hr:border-gray-100"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <Footer />
    </main>
  );
}
