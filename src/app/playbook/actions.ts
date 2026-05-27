"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { CompetitorHandle, Playbook } from "@/lib/types";

export interface SettingsPatch {
  productName?: string;
  productUrl?: string;
  productDescription?: string;
  painPoint?: string;
  competitors?: CompetitorHandle[];
}

export async function updatePlaybookSettings(playbookId: string, patch: SettingsPatch) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: row, error: fetchErr } = await admin
    .from("playbooks")
    .select("data")
    .eq("id", playbookId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !row?.data) throw new Error("Playbook not found");

  const stored = row.data as { playbook?: Playbook; formData?: Record<string, unknown> } & Partial<Playbook>;
  const playbook: Playbook = (stored.playbook ?? (stored as unknown as Playbook));
  const formData: Record<string, unknown> = stored.formData ?? {};

  if (patch.productName !== undefined) {
    playbook.productName = patch.productName;
    formData.productName = patch.productName;
  }
  if (patch.productUrl !== undefined) {
    playbook.productUrl = patch.productUrl;
    formData.productUrl = patch.productUrl;
  }
  if (patch.productDescription !== undefined) {
    playbook.productDescription = patch.productDescription;
    formData.productDescription = patch.productDescription;
    if (patch.productDescription.trim()) playbook.summary = patch.productDescription;
  }
  if (patch.painPoint !== undefined) {
    playbook.painPoint = patch.painPoint;
    formData.problemItSolves = patch.painPoint;
  }
  if (patch.competitors !== undefined) {
    playbook.competitors = patch.competitors;
    formData.competitors = patch.competitors.map((c) => c.handle);
  }

  const updates: Record<string, unknown> = { data: { playbook, formData } };
  if (patch.productName !== undefined) updates.product_name = patch.productName;

  const { error: updateErr } = await admin
    .from("playbooks")
    .update(updates)
    .eq("id", playbookId)
    .eq("user_id", user.id);

  if (updateErr) throw new Error("Failed to save settings");

  return { playbook };
}

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
