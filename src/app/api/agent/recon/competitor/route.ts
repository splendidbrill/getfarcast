import { load } from "cheerio";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import { withBrowser, withIsolatedPage } from "@/lib/agent/browserService";
import { getBurnerSession, isPaidUser } from "@/lib/agent/burnerSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WebsiteData {
  headline: string;
  subheadlines: string[];
  metaDescription: string;
  pricingMentions: string[];
  blogTitles: string[];
}

interface TwitterData {
  recentTweets: string[];
  source: string;
}

interface LinkedInData {
  tagline: string;
  about: string;
  followers: string;
}

interface InstagramData {
  bio: string;
  recentPosts: string[];
}

interface ScrapedData {
  website: WebsiteData;
  twitter?: TwitterData;
  linkedin?: LinkedInData;
  instagram?: InstagramData;
}

interface CounterPost {
  platform: "linkedin" | "twitter_x" | "founder_story";
  label: string;
  content: string;
  angle: string;
}

interface CompetitorIntelResult {
  marketingAngle: string;
  topWeaknesses: string[];
  counterPosts: CounterPost[];
}

// ── Nitter instances (tried in order, skip on failure) ────────────────────────

const NITTER_INSTANCES = [
  "nitter.privacydev.net",
  "nitter.poast.org",
  "nitter.catsarch.com",
  "nitter.tiekoetter.com",
];

// ── Scrape helpers ─────────────────────────────────────────────────────────────

async function scrapeWebsite(
  compUrl: string,
  browser: Parameters<Parameters<typeof withBrowser>[0]>[0]
): Promise<WebsiteData> {
  const data: WebsiteData = {
    headline: "",
    subheadlines: [],
    metaDescription: "",
    pricingMentions: [],
    blogTitles: [],
  };

  await withIsolatedPage(browser, async (page) => {
    try {
      await page.goto(compUrl, { waitUntil: "domcontentloaded", timeout: 25000 });

      data.headline = await page
        .$eval("h1", (el) => el.textContent?.trim() ?? "")
        .catch(() => "");

      data.subheadlines = await page
        .$$eval("h2", (els) =>
          els
            .slice(0, 6)
            .map((el) => el.textContent?.trim() ?? "")
            .filter(Boolean)
        )
        .catch(() => []);

      data.metaDescription = await page
        .$eval('meta[name="description"]', (el) => el.getAttribute("content") ?? "")
        .catch(() => "");

      // Look for pricing numbers on the page
      const bodyText = await page.$eval("body", (el) => el.textContent ?? "").catch(() => "");
      const priceMatches = bodyText.match(/\$[\d,]+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year|user))?/gi) ?? [];
      data.pricingMentions = [...new Set(priceMatches)].slice(0, 10);

      // Try blog/news page
      const blogPaths = ["/blog", "/news", "/articles", "/insights"];
      for (const path of blogPaths) {
        try {
          const blogUrl = new URL(path, compUrl).href;
          await page.goto(blogUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
          const titles = await page
            .$$eval("h1, h2, h3, article h2, .post-title, .entry-title", (els) =>
              els
                .slice(0, 5)
                .map((el) => el.textContent?.trim() ?? "")
                .filter((t) => t.length > 10 && t.length < 200)
            )
            .catch(() => []);
          if (titles.length > 0) {
            data.blogTitles = titles;
            break;
          }
        } catch {
          continue;
        }
      }
    } catch {
      // Gracefully return whatever was collected
    }
  });

  return data;
}

async function scrapeTwitterViaFetch(handle: string): Promise<TwitterData | undefined> {
  const cleanHandle = handle.replace(/^@/, "");

  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`https://${instance}/${cleanHandle}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Farcast/1.0)" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      const $ = load(html);

      const tweets: string[] = [];
      $(".tweet-content").slice(0, 8).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10) tweets.push(text);
      });

      if (tweets.length > 0) {
        return { recentTweets: tweets, source: instance };
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

async function scrapeLinkedIn(
  linkedinUrl: string,
  browser: Parameters<Parameters<typeof withBrowser>[0]>[0],
  cookies?: Array<{ name: string; value: string; domain: string; path: string }>
): Promise<LinkedInData | undefined> {
  const data: LinkedInData = { tagline: "", about: "", followers: "" };
  let gotSomething = false;

  await withIsolatedPage(browser, async (page) => {
    try {
      await page.goto(linkedinUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      // LinkedIn shows partial public data before the login wall
      data.tagline = await page
        .$eval(".org-top-card-summary__tagline, .top-card-layout__headline, h2", (el) =>
          el.textContent?.trim() ?? ""
        )
        .catch(() => "");

      data.about = await page
        .$eval(".about-us__description, .org-about-us-organization-description, p", (el) =>
          el.textContent?.trim() ?? ""
        )
        .catch(() => "");

      data.followers = await page
        .$eval(
          ".org-top-card-summary-info-list__info-item, .top-card-layout__first-subline",
          (el) => el.textContent?.trim() ?? ""
        )
        .catch(() => "");

      gotSomething = !!(data.tagline || data.about || data.followers);
    } catch {
      // silently skip
    }
  });

  return gotSomething ? data : undefined;
}

async function scrapeInstagram(
  handle: string,
  browser: Parameters<Parameters<typeof withBrowser>[0]>[0]
): Promise<InstagramData | undefined> {
  const cleanHandle = handle.replace(/^@/, "");
  const data: InstagramData = { bio: "", recentPosts: [] };
  let gotSomething = false;

  await withIsolatedPage(browser, async (page) => {
    try {
      await page.goto(`https://www.instagram.com/${cleanHandle}/`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      data.bio = await page
        .$eval('meta[name="description"]', (el) => el.getAttribute("content") ?? "")
        .catch(() => "");

      // Instagram renders posts as links with aria-labels on the public view
      const posts = await page
        .$$eval("article img[alt]", (imgs) =>
          imgs
            .slice(0, 6)
            .map((img) => img.getAttribute("alt") ?? "")
            .filter((t) => t.length > 5)
        )
        .catch(() => []);

      data.recentPosts = posts;
      gotSomething = !!(data.bio || data.recentPosts.length > 0);
    } catch {
      // silently skip
    }
  });

  return gotSomething ? data : undefined;
}

// ── Build LLM prompt from scraped data ────────────────────────────────────────

function buildCompetitorPrompt(
  competitorUrl: string,
  data: ScrapedData,
  productName: string,
  productDescription: string
): string {
  const lines: string[] = [
    `We are building: ${productName}`,
    `What we do: ${productDescription}`,
    "",
    `=== COMPETITOR: ${competitorUrl} ===`,
    "",
    "WEBSITE:",
    data.website.headline && `H1: ${data.website.headline}`,
    data.website.subheadlines.length > 0 &&
      `H2s: ${data.website.subheadlines.join(" | ")}`,
    data.website.metaDescription && `Meta: ${data.website.metaDescription}`,
    data.website.pricingMentions.length > 0 &&
      `Pricing found: ${data.website.pricingMentions.join(", ")}`,
    data.website.blogTitles.length > 0 &&
      `Recent blog titles: ${data.website.blogTitles.join(" | ")}`,
  ].filter((l): l is string => typeof l === "string" && !!l);

  if (data.twitter) {
    lines.push("", "TWITTER/X RECENT POSTS:");
    data.twitter.recentTweets.slice(0, 5).forEach((t) => lines.push(`- ${t}`));
  }

  if (data.linkedin) {
    lines.push("", "LINKEDIN:");
    if (data.linkedin.tagline) lines.push(`Tagline: ${data.linkedin.tagline}`);
    if (data.linkedin.about) lines.push(`About: ${data.linkedin.about.slice(0, 300)}`);
    if (data.linkedin.followers) lines.push(`Followers: ${data.linkedin.followers}`);
  }

  if (data.instagram) {
    lines.push("", "INSTAGRAM:");
    if (data.instagram.bio) lines.push(`Bio: ${data.instagram.bio}`);
    if (data.instagram.recentPosts.length > 0) {
      lines.push(`Recent post captions: ${data.instagram.recentPosts.slice(0, 3).join(" | ")}`);
    }
  }

  lines.push(
    "",
    "Based on this competitor data, return a JSON object with this exact shape:",
    '{',
    '  "marketingAngle": "<one sentence: what is their core marketing positioning right now>",',
    '  "topWeaknesses": ["<3 specific weaknesses you can exploit based on evidence above>"],',
    '  "counterPosts": [',
    '    {',
    '      "platform": "linkedin",',
    '      "label": "LinkedIn Counter-Post",',
    '      "content": "<a full LinkedIn post, 150-200 words, professional but punchy, calls out the gap our product fills without naming the competitor>",',
    '      "angle": "<one-line description of the angle used>"',
    '    },',
    '    {',
    '      "platform": "twitter_x",',
    '      "label": "X/Twitter Counter-Post",',
    '      "content": "<a punchy X/Twitter post, max 280 chars, sharp and direct>",',
    '      "angle": "<one-line description of the angle used>"',
    '    },',
    '    {',
    '      "platform": "founder_story",',
    '      "label": "Founder Story Post",',
    '      "content": "<a first-person founder story post, 200-250 words, written as if you discovered the competitor gap yourself and built the solution — for LinkedIn or X threads>",',
    '      "angle": "<one-line description of the angle used>"',
    '    }',
    '  ]',
    '}'
  );

  return lines.join("\n");
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const {
      playbookId,
      competitorUrl,
      twitterHandle,
      linkedinUrl,
      instagramHandle,
      productName,
      productDescription,
    } = (await request.json()) as {
      playbookId: string;
      competitorUrl: string;
      twitterHandle?: string;
      linkedinUrl?: string;
      instagramHandle?: string;
      productName?: string;
      productDescription?: string;
    };

    if (!playbookId || !competitorUrl?.trim()) {
      return Response.json(
        { error: "playbookId and competitorUrl are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Tier check — paid users get proxy + burner sessions
    const { data: authData } = await supabase.auth.getUser();
    const subStatus = authData?.user?.app_metadata?.subscription_status ?? null;
    const paid = isPaidUser(subStatus);

    // ── Scrape all platforms with one browser instance ──────────────────────
    // Paid users get proxy routing; free users scrape public pages only
    const linkedinSession = paid && linkedinUrl
      ? await getBurnerSession("linkedin")
      : null;

    const scrapedData = await withBrowser(async (browser) => {
      const [website, linkedin, instagram] = await Promise.all([
        scrapeWebsite(competitorUrl, browser),
        linkedinUrl ? scrapeLinkedIn(linkedinUrl, browser, linkedinSession?.cookies) : Promise.resolve(undefined),
        instagramHandle ? scrapeInstagram(instagramHandle, browser) : Promise.resolve(undefined),
      ]);
      return { website, linkedin, instagram } as ScrapedData;
    }, paid);

    // Twitter fetch doesn't need a browser
    if (twitterHandle) {
      const twitterData = await scrapeTwitterViaFetch(twitterHandle);
      if (twitterData) scrapedData.twitter = twitterData;
    }

    // ── LLM analysis ────────────────────────────────────────────────────────
    const client = getLLMClient();
    const model = getModelId();

    const prompt = buildCompetitorPrompt(
      competitorUrl,
      scrapedData,
      productName ?? "",
      productDescription ?? ""
    );

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a competitive intelligence strategist and content writer. You identify competitor weaknesses and write high-converting counter-content. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.65,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = parseJSON<CompetitorIntelResult>(raw);

    // ── Persist to Supabase ──────────────────────────────────────────────────
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: saved } = await admin
      .from("competitor_intel")
      .upsert(
        {
          user_id: user.id,
          playbook_id: playbookId,
          competitor_url: competitorUrl,
          scraped_data: scrapedData,
          counter_posts: result.counterPosts ?? [],
          marketing_angle: result.marketingAngle ?? "",
          top_weaknesses: result.topWeaknesses ?? [],
        },
        { onConflict: "user_id,playbook_id,competitor_url" }
      )
      .select("id")
      .single();

    return Response.json({
      id: saved?.id ?? null,
      competitorUrl,
      marketingAngle: result.marketingAngle,
      topWeaknesses: result.topWeaknesses,
      counterPosts: result.counterPosts,
      platformsScraped: {
        website: !!scrapedData.website.headline || !!scrapedData.website.metaDescription,
        twitter: !!scrapedData.twitter,
        linkedin: !!scrapedData.linkedin,
        instagram: !!scrapedData.instagram,
      },
    });
  } catch (err) {
    console.error("[competitor-recon]", err);
    return Response.json({ error: "Failed to run competitor recon" }, { status: 500 });
  }
}
