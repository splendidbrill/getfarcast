"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "./TiptapEditor";
import { ArrowLeft, Save, Loader2, Upload } from "lucide-react";
import Link from "next/link";

export interface PostData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  cover_image: string;
  status: "draft" | "published";
  published_at: string;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const EMPTY: PostData = {
  title: "", slug: "", content: "", excerpt: "", meta_title: "",
  meta_description: "", cover_image: "", status: "draft", published_at: "",
};

export function PostForm({ initial }: { initial?: PostData }) {
  const router = useRouter();
  const [form, setForm] = useState<PostData>(initial ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(!!initial?.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { filename } = await res.json();

      set("cover_image", `${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/uploads/${filename}`);
    } catch (err) {
      console.error("Cover upload failed:", err);
      setError("Cover image upload failed. Please try again.");
    } finally {
      setCoverUploading(false);
    }
  };

  const set = (key: keyof PostData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");

    const url = form.id ? `/api/blog-master/posts/${form.id}` : "/api/blog-master/posts";
    const method = form.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        published_at: form.published_at || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (!form.id) {
        router.push(`/blog-master/edit/${data.post.id}`);
      } else {
        setForm((prev) => ({ ...prev, ...data.post }));
      }
    } else {
      const data = await res.json();
      setError(data.error ?? "Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/blog-master/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1a1a2e] transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Posts
          </Link>

          <div className="flex items-center gap-3">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/30"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main editor */}
        <div className="flex-1 min-w-0 space-y-4">
          <input
            type="text"
            placeholder="Post title…"
            value={form.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugEdited) set("slug", slugify(e.target.value));
            }}
            className="w-full text-3xl font-black text-[#1a1a2e] placeholder-gray-200 bg-transparent border-none outline-none"
          />
          <TiptapEditor content={form.content} onChange={(html) => set("content", html)} />
          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Publish Settings</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">URL Slug</label>
              <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#ff6b4e]/30">
                <span className="px-2 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 shrink-0">/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => { setSlugEdited(true); set("slug", slugify(e.target.value)); }}
                  placeholder="your-post-slug"
                  className="flex-1 px-2 py-2.5 text-sm text-gray-700 bg-white focus:outline-none min-w-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Publish Date</label>
              <input
                type="datetime-local"
                value={form.published_at ? form.published_at.slice(0, 16) : ""}
                onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Cover Image</label>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#ff6b4e] hover:text-[#ff6b4e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {coverUploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Upload className="w-4 h-4" /> {form.cover_image ? "Replace image" : "Upload cover image"}</>
                }
              </button>
              {form.cover_image && (
                <img src={form.cover_image} alt="Cover preview" className="w-full rounded-xl mt-2 object-cover aspect-video" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">SEO</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Excerpt / Meta Description</label>
              <textarea
                rows={3}
                placeholder="A short summary (used for meta description and cards). Under 160 characters."
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/30 resize-none"
              />
              <p className={`text-[11px] ${form.excerpt.length > 160 ? "text-red-500" : "text-gray-400"}`}>
                {form.excerpt.length}/160
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">SEO Title <span className="font-normal text-gray-400">(optional override)</span></label>
              <input
                type="text"
                placeholder={form.title || "Defaults to post title"}
                value={form.meta_title}
                onChange={(e) => set("meta_title", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/30"
              />
              <p className={`text-[11px] ${form.meta_title.length > 60 ? "text-red-500" : "text-gray-400"}`}>
                {form.meta_title.length}/60
              </p>
            </div>

            {/* Live preview */}
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50 space-y-0.5">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">Google Preview</p>
              <p className="text-sm font-medium text-blue-700 truncate">{form.meta_title || form.title || "Post Title"}</p>
              <p className="text-[11px] text-green-700">getfarcast.com/blog/{form.slug || "your-post-slug"}</p>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{form.excerpt || "Your post excerpt will appear here…"}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
