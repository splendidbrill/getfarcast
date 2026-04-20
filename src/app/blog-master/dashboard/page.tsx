"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Plus, Pencil, Trash2, LogOut, Globe, FileText, Loader2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  excerpt: string;
}

export default function BlogDashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blog-master/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/blog-master/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleLogout = async () => {
    await fetch("/api/blog-master/logout", { method: "POST" });
    router.push("/blog-master");
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-[#1a1a2e]">Blog Master</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blog-master/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> New Post
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1a1a2e]">All Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff6b4e]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-black/5">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No posts yet.</p>
            <Link href="/blog-master/new" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6b4e] text-white text-sm font-bold shadow-sm hover:bg-[#e85c3f] transition-colors">
              <Plus className="w-4 h-4" /> Write your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-black/5 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#ff6b4e]/20 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      post.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {post.status === "published" ? <Globe className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                      {post.status}
                    </span>
                    {post.published_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-[#1a1a2e] truncate">{post.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">/{post.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {post.status === "published" && (
                    <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                      <Globe className="w-3.5 h-3.5" /> View
                    </Link>
                  )}
                  <Link href={`/blog-master/edit/${post.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    disabled={deleting === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
