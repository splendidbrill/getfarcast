"use client";

import { useState } from "react";
import { Mail, MessageSquare, Copy, Check, Send } from "lucide-react";
import type { OutreachSequence } from "@/lib/types";

export function PlaybookOutreach({
  outreach,
}: {
  outreach: OutreachSequence;
}) {
  const [copiedEmail, setCopiedEmail] = useState<number | null>(null);
  const [copiedDM, setCopiedDM] = useState<number | null>(null);

  const handleCopyEmail = async (email: { subject: string; body: string }, idx: number) => {
    await navigator.clipboard.writeText(
      `Subject: ${email.subject}\n\n${email.body}`
    );
    setCopiedEmail(idx);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyDM = async (message: string, idx: number) => {
    await navigator.clipboard.writeText(message);
    setCopiedDM(idx);
    setTimeout(() => setCopiedDM(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Email Sequence */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Cold Email Sequence
            </h2>
            <p className="text-xs text-surface-200/40">
              {outreach.emailSequence.length}-touch sequence ready to send
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/30 via-accent-500/30 to-emerald-500/30 hidden sm:block" />

          <div className="space-y-4">
            {outreach.emailSequence.map((email, i) => (
              <div key={i} className="relative flex gap-4 sm:gap-6">
                {/* Day badge */}
                <div className="shrink-0 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center border border-brand-500/20">
                    <span className="text-xs font-bold text-brand-400">
                      D{email.day}
                    </span>
                  </div>
                </div>

                {/* Email card */}
                <div className="flex-1 glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Send className="w-3 h-3 text-brand-400" />
                        <span className="text-[10px] text-surface-200/30 uppercase tracking-wider font-medium">
                          Day {email.day} — {email.purpose}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {email.subject}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleCopyEmail(email, i)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-surface-200/40 hover:text-white border border-white/10 hover:border-white/20 transition-all shrink-0"
                    >
                      {copiedEmail === i ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <p className="text-xs text-surface-200/60 leading-relaxed whitespace-pre-wrap">
                      {email.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DM Templates */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-emerald-500 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">DM Templates</h2>
            <p className="text-xs text-surface-200/40">
              Platform-specific direct messages
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {outreach.dmTemplates.map((dm, i) => (
            <div key={i} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-500/10 text-accent-400 uppercase font-bold">
                  {dm.platform}
                </span>
                <button
                  onClick={() => handleCopyDM(dm.message, i)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-surface-200/40 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                >
                  {copiedDM === i ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5 mb-3">
                <p className="text-xs text-surface-200/60 leading-relaxed whitespace-pre-wrap">
                  {dm.message}
                </p>
              </div>
              <p className="text-[10px] text-surface-200/30">
                <span className="font-medium">When to send:</span> {dm.context}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
