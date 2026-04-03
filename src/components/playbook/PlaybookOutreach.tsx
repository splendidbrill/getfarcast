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
    <div className="space-y-10">
      {/* Email Sequence */}
      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a2e]">
              Cold Email Sequence
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {outreach.emailSequence.length}-touch sequence heavily optimized for founders
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-4 sm:pl-0">
          {/* Connecting line */}
          <div className="absolute left-[2.25rem] top-8 bottom-8 w-1 bg-blue-100 rounded-full hidden sm:block" />

          <div className="space-y-6">
            {outreach.emailSequence.map((email, i) => (
              <div key={i} className="relative flex gap-4 sm:gap-8">
                {/* Day badge */}
                <div className="shrink-0 relative z-10 hidden sm:block">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-blue-50 flex items-center justify-center shadow-sm relative">
                    <span className="text-sm font-extrabold text-blue-600">
                      Day {email.day}
                    </span>
                  </div>
                </div>

                {/* Email card */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -z-10" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Send className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] text-blue-600 uppercase tracking-wider font-extrabold bg-blue-50 px-2 py-0.5 rounded-md">
                          Phase: {email.purpose}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold sm:hidden bg-gray-100 px-2 py-0.5 rounded-md">
                          Day {email.day}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1a1a2e]">
                        Subject: {email.subject}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleCopyEmail(email, i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 self-start ${
                        copiedEmail === i
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-white text-gray-500 border border-gray-200 hover:border-[#ff6b4e] hover:text-[#ff6b4e]"
                      }`}
                    >
                      {copiedEmail === i ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Email
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {email.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* DM Templates */}
      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md shadow-[#ff6b4e]/20">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a2e]">Direct Messages</h2>
            <p className="text-sm text-gray-500 font-medium">
              Short, high-converting DMs per platform
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {outreach.dmTemplates.map((dm, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b4e]/5 rounded-bl-full -z-10" />
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <span className="text-xs px-3 py-1 rounded-lg bg-[#1a1a2e] text-white uppercase font-bold tracking-wider shadow-sm">
                  {dm.platform}
                </span>
                <button
                  onClick={() => handleCopyDM(dm.message, i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copiedDM === i
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-[#ff6b4e] hover:text-[#ff6b4e]"
                  }`}
                >
                  {copiedDM === i ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy DM
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-[#ff6b4e]/5 rounded-xl p-4 border border-[#ff6b4e]/10 mb-4">
                <p className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                  {dm.message}
                </p>
              </div>
              
              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-lg leading-none mt-0.5">💡</span>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  <span className="font-bold text-gray-900 block mb-0.5">When to send:</span>
                  {dm.context}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
