"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deletePlaybook(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Delete matching id AND user_id to ensure ownership
  const { error } = await supabase
    .from("playbooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete playbook", error);
    throw new Error("Failed to delete playbook");
  }

  revalidatePath("/dashboard");
}
