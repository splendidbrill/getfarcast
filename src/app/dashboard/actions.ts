"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function deletePlaybook(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Use admin client to bypass RLS; ownership enforced by user_id filter
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: deleted, error } = await admin
    .from("playbooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("Failed to delete playbook", error);
    throw new Error("Failed to delete playbook");
  }

  if (!deleted || deleted.length === 0) {
    throw new Error("Playbook not found or not owned by user");
  }

  revalidatePath("/dashboard");
}
