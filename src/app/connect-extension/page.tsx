"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, CheckCircle, XCircle, Loader } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "success" | "error" | "unauthenticated";

function ConnectExtensionContent() {
    const searchParams = useSearchParams();
    const extId = searchParams.get("extId");
    const [status, setStatus] = useState<Status>("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!extId) {
            setStatus("error");
            setMessage("Missing extension ID. Open this page from the Farcast extension popup.");
            return;
        }

        const supabase = createClient();

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setStatus("unauthenticated");
                setMessage("You need to be logged in to connect the extension.");
                return;
            }

            // Send the access token to the extension
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (chrome as any).runtime.sendMessage(
                extId,
                { type: "SET_AUTH_TOKEN", token: session.access_token },
                (response: { ok: boolean } | undefined) => {
                    if (chrome.runtime.lastError || !response?.ok) {
                        setStatus("error");
                        setMessage("Could not reach the extension. Make sure it's installed and reload this page.");
                        return;
                    }
                    setStatus("success");
                    setMessage("Extension connected! You can close this tab.");
                }
            );
        });
    }, [extId]);

    return (
        <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center p-6 text-[#1a1a2e]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff6b4e]/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative w-full max-w-md bg-white rounded-3xl p-10 border border-gray-100 shadow-xl z-10 text-center">
                <div className="inline-flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b4e] to-[#ff8c5a] flex items-center justify-center shadow-md">
                        <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]">
                        Get<span className="text-[#ff6b4e]">Farcast</span>
                    </span>
                </div>

                <h1 className="text-2xl font-bold mb-3">Connect Extension</h1>

                <div className="flex flex-col items-center gap-4 mt-8">
                    {status === "loading" && (
                        <>
                            <Loader className="w-10 h-10 text-[#ff6b4e] animate-spin" />
                            <p className="text-gray-500 font-medium text-sm">Connecting your account…</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                            <p className="text-gray-700 font-semibold text-sm">{message}</p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="w-10 h-10 text-red-500" />
                            <p className="text-gray-700 font-semibold text-sm">{message}</p>
                        </>
                    )}

                    {status === "unauthenticated" && (
                        <>
                            <XCircle className="w-10 h-10 text-yellow-500" />
                            <p className="text-gray-700 font-semibold text-sm mb-4">{message}</p>
                            <a
                                href={`/login?redirect=/connect-extension?extId=${extId}`}
                                className="rounded-xl bg-[#ff6b4e] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition"
                            >
                                Log in
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ConnectExtensionPage() {
    return (
        <Suspense>
            <ConnectExtensionContent />
        </Suspense>
    );
}
