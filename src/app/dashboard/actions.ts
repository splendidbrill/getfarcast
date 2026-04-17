"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function deletePlaybook(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify ownership before deleting
  const { data: playbook } = await adminClient
    .from("playbooks")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!playbook || playbook.user_id !== user.id) {
    throw new Error("Playbook not found or access denied");
  }

  const { error } = await adminClient
    .from("playbooks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete playbook", error);
    throw new Error("Failed to delete playbook");
  }

  revalidatePath("/dashboard");
}
