const USER_AGENT = 'Farcast/1.0 (content generation tool)';

export interface SubredditContext {
  subreddit: string;
  rules: string;
  topPosts: Array<{ title: string; selftext: string; score: number }>;
}

async function redditFetch(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Reddit fetch failed ${res.status}: ${url}`);
  return res.json();
}

export async function fetchSubredditContext(subreddit: string): Promise<SubredditContext> {
  const clean = subreddit.replace(/^r\//, '');

  const [rulesResult, topResult] = await Promise.allSettled([
    redditFetch(`https://www.reddit.com/r/${clean}/about/rules.json`),
    redditFetch(`https://www.reddit.com/r/${clean}/top.json?t=week&limit=5`),
  ]);

  let rules = '';
  if (rulesResult.status === 'fulfilled') {
    const list: Array<{ short_name: string; description: string }> =
      rulesResult.value?.rules ?? [];
    rules = list.map((r, i) => `${i + 1}. ${r.short_name}: ${r.description}`).join('\n');
  }

  let topPosts: SubredditContext['topPosts'] = [];
  if (topResult.status === 'fulfilled') {
    topPosts = (topResult.value?.data?.children ?? []).map((c: { data: { title: string; selftext: string; score: number } }) => ({
      title: c.data.title,
      selftext: (c.data.selftext ?? '').slice(0, 300),
      score: c.data.score,
    }));
  }

  return { subreddit: clean, rules, topPosts };
}

export async function validateSubreddit(subreddit: string): Promise<boolean> {
  try {
    const clean = subreddit.replace(/^r\//, '');
    const json = await redditFetch(`https://www.reddit.com/r/${clean}/about.json`);
    const data = json?.data;
    return (
      (data?.subscribers ?? 0) >= 10000 &&
      data?.subreddit_type !== 'private' &&
      data?.subreddit_type !== 'restricted'
    );
  } catch {
    return false;
  }
}
