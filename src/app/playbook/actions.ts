"use server";

import { createClient } from "@/lib/supabase/server";
import type { Playbook } from "@/lib/types";

export async function updatePostFeedback(
  playbookId: string,
  channelName: string,
  postIndex: number,
  rating?: "fire" | "ok" | "flop",
  comments?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // 1. Fetch the existing playbook
  const { data, error: fetchErr } = await supabase
    .from("playbooks")
    .select("data")
    .eq("id", playbookId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !data) {
    throw new Error("Playbook not found or unauthorized");
  }

  const playbook = data.data as Playbook;

  // 2. Modify the specific post
  try {
    const channel = playbook.channels.find(c => c.name === channelName);
    if (!channel) throw new Error("Channel not found");
    
    // In contentCalendar, postIndex could just be the array index or day matching, but array index is safer if we pass it directly
    const post = channel.contentCalendar[postIndex];
    if (rating !== undefined) {
      post.feedbackRating = rating;
    }
    if (comments !== undefined) {
      post.feedbackComments = comments;
    }
  } catch (e) {
    throw new Error("Invalid channel or post index");
  }

  // 3. Update the database securely
  const { error: updateErr } = await supabase
    .from("playbooks")
    .update({ data: playbook as any })
    .eq("id", playbookId)
    .eq("user_id", user.id);

  if (updateErr) {
    throw new Error("Failed to save feedback");
  }

  return { success: true };
}
