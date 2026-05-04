"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import {
    ArrowRight,
    Loader2,
    Mail,
    MessageSquare,
    Send,
    User2,
    type LucideIcon,
} from "lucide-react";

type FormState = {
    name: string;
    email: string;
    company: string;
    message: string;
};

const initialState: FormState = {
    name: "",
    email: "",
    company: "",
    message: "",
};

const inputClassName =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-[#1a1a2e] outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#ff6b4e]/40 focus:ring-4 focus:ring-[#ff6b4e]/10";

export function ContactForm() {
    const [form, setForm] = useState<FormState>(initialState);
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [feedback, setFeedback] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus("submitting");
        setFeedback("");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(data.error || "Unable to send message.");
            }

            setStatus("success");
            setFeedback("Thanks — your message is on its way. We’ll get back to you soon.");
            setForm(initialState);
        } catch (error) {
            setStatus("error");
            setFeedback(error instanceof Error ? error.message : "Unable to send message.");
        }
    };

    return (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="space-y-8">
                <div>
                    <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#ff6b4e]">
                        Contact / Feedback
                    </p>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-5xl leading-tight">
                        Let&apos;s talk about your growth engine.
                    </h1>
                    <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-gray-600">
                        Send over your product, goals, or enterprise requirements and we&apos;ll reply directly to help you get set up.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                        {
                            title: "Reach out to us",
                            text: "If you have any questions, suggestions, or need help with our product, we’d love to hear from you.",
                            icon: Mail,
                        },
                        {
                            title: "Provide any feedback",
                            text: "We would love to hear your feedback and suggestions.",
                            icon: Send,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-lg shadow-black/5"
                            >
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6b4e]/10 text-[#ff6b4e]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h2 className="mb-2 text-lg font-bold text-[#1a1a2e]">{item.title}</h2>
                                <p className="text-sm font-medium leading-relaxed text-gray-600">{item.text}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-[28px] border border-black/5 bg-white p-6 shadow-2xl shadow-[#ff6b4e]/10 sm:p-8"
            >
                <div className="space-y-5">
                    <Field label="Your name" icon={User2}>
                        <input
                            required
                            name="name"
                            value={form.name}
                            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                            className={inputClassName}
                            placeholder="Jane Founder"
                        />
                    </Field>

                    <Field label="Work email" icon={Mail}>
                        <input
                            required
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                            className={inputClassName}
                            placeholder="jane@company.com"
                        />
                    </Field>

                    <Field label="Company" icon={ArrowRight}>
                        <input
                            name="company"
                            value={form.company}
                            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                            className={inputClassName}
                            placeholder="Acme Inc."
                        />
                    </Field>

                    <Field label="How can we help?" icon={MessageSquare}>
                        <textarea
                            required
                            name="message"
                            value={form.message}
                            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                            className={`${inputClassName} min-h-36 resize-y`}
                            placeholder="Tell us what you sell, who you want to reach, and what kind of help you need."
                        />
                    </Field>
                </div>

                <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#ff6b4e]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <span className="inline-flex items-center justify-center gap-2">
                        {status === "submitting" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {status === "submitting" ? "Sending..." : "Send message"}
                    </span>
                </button>

                {feedback ? (
                    <p
                        className={`mt-4 text-sm font-semibold ${status === "success" ? "text-emerald-600" : "text-red-500"
                            }`}
                    >
                        {feedback}
                    </p>
                ) : null}
            </form>
        </div>
    );
}

function Field({
    label,
    icon: Icon,
    children,
}: {
    label: string;
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-[#1a1a2e]">
                <Icon className="h-4 w-4 text-[#ff6b4e]" />
                {label}
            </span>
            {children}
        </label>
    );
}