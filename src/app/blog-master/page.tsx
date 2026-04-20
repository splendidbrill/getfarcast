"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";

export default function BlogMasterLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/blog-master/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/blog-master/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-[#1a1a2e]">Blog Master</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-black/5 shadow-sm p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1a2e] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1a1a2e] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6b4e]/40 focus:border-[#ff6b4e] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
