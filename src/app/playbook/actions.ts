// Client-side function to update post feedback in localStorage
export function updatePostFeedback(
  playbookId: string,
  postIndex: number,
  rating?: "fire" | "ok" | "flop",
  comments?: string
) {
  const raw = localStorage.getItem(`playbook_${playbookId}`);
  if (!raw) return;

  try {
    const stored = JSON.parse(raw);
    const playbook = stored.playbook || stored; // Ensure we handle nested playbook if needed
    
    // Fallback if data structure is odd
    const posts = playbook.postsCalendar?.posts || playbook.data?.playbook?.postsCalendar?.posts;

    if (!posts || !posts[postIndex]) return;

    const post = posts[postIndex];

    if (rating !== undefined) {
      post.feedbackRating = rating;
    }
    if (comments !== undefined) {
      post.feedbackComments = comments;
    }

    // Save back to localStorage
    localStorage.setItem(`playbook_${playbookId}`, JSON.stringify(stored));
  } catch (e) {
    console.error("Failed to update feedback", e);
  }
}
