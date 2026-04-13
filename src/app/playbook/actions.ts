"use client";

import { createClient } from "@/lib/supabase/client";

// =====================================================
// updatePostFeedback
// Writes feedback (rating + comments) to both
// localStorage (instant UI) and Supabase (persistent).
// weekIndex identifies which week's posts to update.
// =====================================================
export async function updatePostFeedback(
  playbookId: string,
  postIndex: number,
  rating?: "fire" | "ok" | "flop",
  comments?: string,
  weekIndex: number = 0
) {
  // ── 1. Update localStorage ─────────────────────────
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`playbook_${playbookId}`);
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        const playbook = stored.playbook || stored;

        const weeks: any[] = Array.isArray(playbook.postsCalendar)
          ? playbook.postsCalendar
          : playbook.postsCalendar
          ? [playbook.postsCalendar]
          : [];

        const week = weeks[weekIndex];
        if (!week || !week.posts || !week.posts[postIndex]) {
          console.warn("updatePostFeedback: post not found at", { weekIndex, postIndex });
        } else {
          const post = week.posts[postIndex];
          if (rating !== undefined) post.feedbackRating = rating;
          if (comments !== undefined) post.feedbackComments = comments;
          playbook.postsCalendar = weeks;
          stored.playbook = playbook;
          localStorage.setItem(`playbook_${playbookId}`, JSON.stringify(stored));
        }
      } catch (e) {
        console.error("Failed to update feedback in localStorage", e);
      }
    }
  }

  // ── 2. Persist to Supabase ─────────────────────────
  try {
    const supabase = createClient();
    const { data: record, error } = await supabase
      .from("playbooks")
      .select("data")
      .eq("id", playbookId)
      .single();

    if (error || !record) return;

    const storedData = record.data;
    const playbook = storedData.playbook || storedData;

    const weeks: any[] = Array.isArray(playbook.postsCalendar)
      ? playbook.postsCalendar
      : playbook.postsCalendar
      ? [playbook.postsCalendar]
      : [];

    const week = weeks[weekIndex];
    if (!week || !week.posts || !week.posts[postIndex]) return;

    const post = week.posts[postIndex];
    if (rating !== undefined) post.feedbackRating = rating;
    if (comments !== undefined) post.feedbackComments = comments;
    playbook.postsCalendar = weeks;
    storedData.playbook = playbook;

    await supabase
      .from("playbooks")
      .update({ data: storedData })
      .eq("id", playbookId);
  } catch (e) {
    console.error("Failed to persist feedback to Supabase", e);
  }
}

// =====================================================
// WeekGateResult
// Returned by checkWeekGate to tell the UI whether
// generation can proceed and why/why not.
// =====================================================
export interface WeekGateResult {
  allowed: boolean;
  /** Gate reasons (may be multiple) */
  timeGateFailed?: boolean;
  feedbackGateFailed?: boolean;
  /** How many hours remain until time gate unlocks */
  hoursRemaining?: number;
  /** How many posts still need a rating */
  feedbackNeeded?: number;
  /** How many posts the user has already rated */
  feedbackGiven?: number;
  /** Total posts in the previous week */
  totalPosts?: number;
  /** Minimum posts that must be rated */
  minimumRequired?: number;
}

// =====================================================
// checkWeekGate
// Determines whether a given week can be generated.
// Rules:
//   Week 2  → 24h after Week 1 generatedAt
//   Week 3+ → 10 days after Week 1 generatedAt
//   All     → 10% of previous week's posts must be rated
// =====================================================
export function checkWeekGate(
  playbookId: string,
  targetWeek: number // 2, 3, 4 …
): WeekGateResult {
  if (typeof window === "undefined") {
    return { allowed: false };
  }

  const raw = localStorage.getItem(`playbook_${playbookId}`);
  if (!raw) return { allowed: false };

  let playbook: any;
  try {
    const stored = JSON.parse(raw);
    playbook = stored.playbook || stored;
  } catch {
    return { allowed: false };
  }

  const weeks: any[] = Array.isArray(playbook.postsCalendar)
    ? playbook.postsCalendar
    : playbook.postsCalendar
    ? [playbook.postsCalendar]
    : [];

  // Must have the previous week
  const prevWeekIndex = targetWeek - 2; // 0-based
  const prevWeek = weeks[prevWeekIndex];
  if (!prevWeek) return { allowed: false };

  // ── Time gate ─────────────────────────────────────
  // Week 1 generatedAt is always the anchor for Week 3+
  const week1 = weeks[0];
  const anchorTs = targetWeek === 2
    ? prevWeek.generatedAt     // 24h from Week 1
    : week1?.generatedAt;      // 10d from Week 1 for Week 3+

  let timeGateFailed = false;
  let hoursRemaining: number | undefined;

  if (anchorTs) {
    const anchorMs = new Date(anchorTs).getTime();
    const nowMs = Date.now();
    const requiredMs = targetWeek === 2
      ? 24 * 60 * 60 * 1000          // 24 hours
      : 10 * 24 * 60 * 60 * 1000;    // 10 days

    const elapsed = nowMs - anchorMs;
    if (elapsed < requiredMs) {
      timeGateFailed = true;
      hoursRemaining = Math.ceil((requiredMs - elapsed) / (60 * 60 * 1000));
    }
  }
  // If no timestamp exists yet (legacy data), don't enforce time gate
  // — they already waited implicitly.

  // ── Feedback gate ─────────────────────────────────
  const posts: any[] = prevWeek.posts || [];
  const totalPosts = posts.length;
  const minimumRequired = Math.max(1, Math.ceil(totalPosts * 0.1));
  const feedbackGiven = posts.filter(
    (p: any) => p.feedbackRating !== undefined && p.feedbackRating !== null
  ).length;
  const feedbackGateFailed = feedbackGiven < minimumRequired;
  const feedbackNeeded = feedbackGateFailed ? minimumRequired - feedbackGiven : 0;

  const allowed = !timeGateFailed && !feedbackGateFailed;

  return {
    allowed,
    timeGateFailed,
    feedbackGateFailed,
    hoursRemaining,
    feedbackNeeded,
    feedbackGiven,
    totalPosts,
    minimumRequired,
  };
}
