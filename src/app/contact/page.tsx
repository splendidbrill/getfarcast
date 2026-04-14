import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ContactForm } from "@/components/contact/ContactForm";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-[#faf8f6] font-sans text-[#1a1a2e] selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e]">
            <Navbar />
            <section className="relative overflow-hidden pb-24 pt-32 sm:pb-28 sm:pt-36">
                <div className="pointer-events-none absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[#ff6b4e]/8 blur-[140px]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/5 blur-[140px]" />

                <div className="relative z-10 mx-auto max-w-6xl px-6">
                    <ContactForm />
                </div>
            </section>
            <Footer />
        </main>
    );
}