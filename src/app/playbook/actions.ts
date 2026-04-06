// Client-side function to update post feedback in localStorage
export function updatePostFeedback(
  playbookId: string,
  channelName: string,
  postIndex: number,
  rating?: "fire" | "ok" | "flop",
  comments?: string
) {
  const raw = localStorage.getItem(`playbook_${playbookId}`);
  if (!raw) return;

  try {
    const stored = JSON.parse(raw);
    const playbook = stored.playbook;

    const channel = playbook.channels.find((c: any) => c.name === channelName);
    if (!channel) return;

    const post = channel.contentCalendar[postIndex];
    if (!post) return;

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
