import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Read the Terms of Service for Farcast.",
};

const sections = [
    {
        title: "1. Description of Service",
        body: [
            "Our Service provides enhanced analytics for your social media activities, offering insights and tools to help you better understand and optimize your social media engagement.",
        ],
    },
    {
        title: "2. Eligibility",
        body: [
            "Our Service provides enhanced analytics for your social media activities, offering insights and tools to help you better understand and optimize your social media engagement.",
        ],
    },
    {
        title: "3. Account Registration",
        body: [
            "You may be required to create an account to access certain features of the Service. You agree to provide accurate and complete information during the registration process and to update such information as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
        ],
    },
    {
        title: "4. Use of the Service",
        body: [
            "You agree to use the Service in compliance with all applicable laws and regulations. You must not:",
        ],
        bullets: [
            "Use the Service for any illegal or unauthorized purpose.",
            "Interfere with or disrupt the Service or servers or networks connected to the Service.",
            "Engage in any activity that could harm or impair the performance or security of the Service.",
        ],
    },
    {
        title: "5. Privacy",
        body: [
            "Your use of the Service is subject to our Privacy Policy, which is incorporated by reference into these Terms. Please review our Privacy Policy to understand our practices regarding your personal data.",
        ],
    },
    {
        title: "6. Intellectual Property",
        body: [
            "All intellectual property rights in the Service, including but not limited to software, design, text, images, and trademarks, are owned by us or our licensors. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for your personal, non-commercial use.",
        ],
    },
    {
        title: "7. Termination",
        body: [
            "We reserve the right to suspend or terminate your access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is otherwise harmful to other users or the Service.",
        ],
    },
    {
        title: "8. Disclaimer of Warranties",
        body: [
            "The Service is provided \"as is\" and \"as available\" without any warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Service will be uninterrupted, secure, or error-free.",
        ],
    },
    {
        title: "9. Limitation of Liability",
        body: [
            "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your use of or inability to use the Service; (b) any unauthorized access to or use of our servers and/or any personal information stored therein; (c) any interruption or cessation of transmission to or from the Service; (d) any bugs, viruses, trojan horses, or the like that may be transmitted to or through the Service by any third party; (e) any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content posted, emailed, transmitted, or otherwise made available through the Service; and/or (f) the defamatory, offensive, or illegal conduct of any third party.",
        ],
    },
    {
        title: "10. Changes to the Terms",
        body: [
            "We may revise these Terms from time to time. If we make material changes, we will notify you by posting the updated Terms on our website or through other communications. By continuing to use the Service after such changes, you agree to the revised Terms.",
        ],
    },
    {
        title: "11. Governing Law",
        body: [
            "These Terms shall be governed by and construed in accordance with the laws of Vietnam, without regard to its conflict of law principles.",
        ],
    },
    {
        title: "12. Contact Information",
        body: [
            "If you have any questions about these Terms, please contact us at contact@thegums.co.",
        ],
    },
];

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#faf8f6] font-sans text-[#1a1a2e] selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e]">
            <Navbar />

            <section className="relative overflow-hidden pb-24 pt-32 sm:pb-28 sm:pt-36">
                <div className="pointer-events-none absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#ff6b4e]/8 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/5 blur-[140px]" />

                <div className="relative z-10 mx-auto max-w-4xl px-6">
                    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-xl shadow-black/5 backdrop-blur sm:p-12">
                        <div className="mb-10 border-b border-gray-100 pb-8">
                            <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-[#ff6b4e]">
                                Terms & Conditions
                            </p>
                            <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-5xl">
                                Terms of Service
                            </h1>
                            <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
                                These Terms of Service ("Terms") govern your use of our web extension and any related services provided by GetFarcast ("we," "us," or "our"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use the Service.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {sections.map((section) => (
                                <section key={section.title} className="space-y-4">
                                    <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">
                                        {section.title}
                                    </h2>

                                    {section.body.map((paragraph) => (
                                        <p key={paragraph} className="text-base leading-7 text-gray-600">
                                            {paragraph}
                                        </p>
                                    ))}

                                    {section.bullets ? (
                                        <ul className="space-y-3 pl-6 text-base leading-7 text-gray-600">
                                            {section.bullets.map((bullet) => (
                                                <li key={bullet} className="list-disc">
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </section>
                            ))}
                        </div>

                        <div className="mt-10 rounded-2xl border border-[#ff6b4e]/10 bg-[#fff7f4] p-5 text-sm leading-6 text-gray-600">
                            <p>
                                By using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                            <p className="mt-3">
                                This draft covers the key points typically found in a Terms of Service agreement. However, it's essential to tailor it to your specific needs and have it reviewed by a legal professional to ensure compliance with applicable laws and regulations.
                            </p>
                        </div>

                        <div className="mt-8">
                            <Link
                                href="/contact"
                                className="inline-flex items-center rounded-xl bg-[#1a1a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2b2b45]"
                            >
                                Contact us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}