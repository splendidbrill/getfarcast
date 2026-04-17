import type { PostsCalendar, ReadyPost } from "@/lib/types";

export interface ContentBatchRequest {
  channel: string;
  expectedPostCount: number;
  weekNumber: number;
}

export function normalizePlatformName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function platformNamesMatch(actual: string, expected: string): boolean {
  const actualNormalized = normalizePlatformName(actual);
  const expectedNormalized = normalizePlatformName(expected);

  return (
    actualNormalized === expectedNormalized ||
    actualNormalized.includes(expectedNormalized) ||
    expectedNormalized.includes(actualNormalized)
  );
}

export function getWeekLabel(weekNumber: number): string {
  if (weekNumber === 1) return "Week 1 - Launch Sprint";
  if (weekNumber === 2) return "Week 2 - Momentum Sprint";
  return `Week ${weekNumber} - Growth Sprint`;
}

export function assertPostsCalendarBatch(
  batch: PostsCalendar,
  request: ContentBatchRequest
): void {
  if (batch.weekNumber !== request.weekNumber) {
    throw new Error(
      `${request.channel} batch returned week ${batch.weekNumber}, expected week ${request.weekNumber}.`
    );
  }

  if (batch.posts.length !== request.expectedPostCount) {
    throw new Error(
      `${request.channel} batch returned ${batch.posts.length} posts, expected ${request.expectedPostCount}.`
    );
  }

  for (const post of batch.posts) {
    if (!platformNamesMatch(post.platform, request.channel)) {
      throw new Error(
        `${request.channel} batch leaked post for platform "${post.platform}".`
      );
    }
  }
}

export function finalizePostsCalendarBatch(
  batch: PostsCalendar,
  request: ContentBatchRequest
): PostsCalendar {
  const posts: ReadyPost[] = batch.posts.map((post) => ({
    ...post,
    platform: request.channel,
    characterCount: post.body.length,
    subredditOrHashtags: post.subredditOrHashtags ?? "",
  }));

  return {
    weekOf: getWeekLabel(request.weekNumber),
    weekNumber: request.weekNumber,
    generatedAt: new Date().toISOString(),
    posts,
  };
}

export function assemblePostsCalendar(
  weekNumber: number,
  batches: PostsCalendar[]
): PostsCalendar {
  return {
    weekOf: getWeekLabel(weekNumber),
    weekNumber,
    generatedAt: new Date().toISOString(),
    posts: batches
      .flatMap((batch) => batch.posts)
      .sort((left, right) => left.day - right.day || left.platform.localeCompare(right.platform)),
  };
}