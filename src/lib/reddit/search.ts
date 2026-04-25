type RedditPost = {
    id: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    subreddit: string;
    created_utc: number;
    num_comments: number;
};

export async function searchReddit(keyword: string, subreddit?: string): Promise<RedditPost[]> {
    const base = subreddit
        ? `https://www.reddit.com/r/${subreddit}/search.json`
        : 'https://www.reddit.com/search.json';

    const url = new URL(base);
    url.searchParams.set('q', keyword);
    url.searchParams.set('sort', 'new');
    url.searchParams.set('limit', '25');
    url.searchParams.set('t', 'day');
    if (subreddit) url.searchParams.set('restrict_sr', '1');

    const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Farcast/1.0 (lead research tool)' },
    });

    if (!res.ok) throw new Error(`Reddit search failed: ${res.status}`);

    const json = await res.json();
    return (json?.data?.children ?? []).map((c: { data: RedditPost }) => c.data);
}
