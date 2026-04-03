import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: playbooks, error } = await supabase
    .from("playbooks")
    .select("id, product_name, created_at, data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load playbooks:", error);
  }

  return (
    <main className="bg-[#faf8f6] text-[#1a1a2e] min-h-screen font-sans selection:bg-[#ff6b4e]/20 selection:text-[#ff6b4e] flex flex-col">
      <Navbar />
      
      {/* Background aesthetics */}
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 107, 78, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 78, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed top-0 inset-x-0 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,200,170,0.3) 0%, transparent 70%)",
        }}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-24 relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a2e] tracking-tight mb-4">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b4e] to-[#ff8c5a]">Engine</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl">
            Access and manage all the 30-day growth playbooks you've generated. Ready to conquer a new channel?
          </p>
        </div>

        <DashboardClient playbooks={playbooks || []} />
      </div>

      <Footer />
    </main>
  );
}
