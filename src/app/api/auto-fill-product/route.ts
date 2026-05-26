import { load } from "cheerio";
import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AutoFillResult {
  does: string;
  problem: string;
  who: string;
}

interface ScrapedSite {
  title: string;
  metaDescription: string;
  ogDescription: string;
  h1: string;
  h2s: string[];
  bodyText: string;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function scrapeSite(url: string): Promise<ScrapedSite> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Farcast/1.0; +https://getfarcast.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Site returned ${res.status}`);
  }

  const html = await res.text();
  const $ = load(html);

  $("script, style, noscript, svg").remove();

  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  const ogDescription =
    $('meta[property="og:description"]').attr("content")?.trim() ?? "";
  const h1 = $("h1").first().text().trim();
  const h2s: string[] = [];
  $("h2").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 2 && t.length < 200) h2s.push(t);
  });
  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  return {
    title,
    metaDescription,
    ogDescription,
    h1,
    h2s: h2s.slice(0, 8),
    bodyText,
  };
}

function buildPrompt(url: string, site: ScrapedSite): string {
  return [
    `Product URL: ${url}`,
    "",
    "=== SCRAPED CONTENT ===",
    site.title && `Title: ${site.title}`,
    site.metaDescription && `Meta description: ${site.metaDescription}`,
    site.ogDescription && `OG description: ${site.ogDescription}`,
    site.h1 && `H1: ${site.h1}`,
    site.h2s.length > 0 && `H2s: ${site.h2s.join(" | ")}`,
    site.bodyText && `Body excerpt: ${site.bodyText}`,
    "",
    "Based on the scraped content above, infer three things about this product and return JSON with this exact shape:",
    "{",
    '  "does": "<2-3 sentences describing what the product does and what it helps people do. Be concrete and specific, written in plain language as if filling out an onboarding form.>",',
    '  "problem": "<1-2 sentences naming the specific pain point or frustration this product solves. Be specific — name the user behavior or cost being eliminated.>",',
    '  "who": "<1 sentence describing the target user (role, stage, context). e.g. \\"Solo founders who just shipped their first SaaS and need their first 100 users.\\">"',
    "}",
    "",
    "Rules:",
    "- Write in plain prose, no marketing fluff, no emojis.",
    "- If the site is sparse, infer from the strongest available signals (title, meta, h1) rather than refusing.",
    "- Return JSON only.",
  ]
    .filter((l): l is string => typeof l === "string" && !!l)
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: string };
    if (!url?.trim()) {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    const normalizedUrl = normalizeUrl(url);

    let site: ScrapedSite;
    try {
      site = await scrapeSite(normalizedUrl);
    } catch (err) {
      console.error("[auto-fill-product] scrape failed", err);
      return Response.json(
        {
          error:
            "Couldn't reach that URL. Double-check it's correct and try again, or fill the fields manually.",
        },
        { status: 502 }
      );
    }

    const hasSignal =
      site.title || site.metaDescription || site.ogDescription || site.h1;
    if (!hasSignal) {
      return Response.json(
        {
          error:
            "We couldn't extract enough from the page. Try a different URL or fill the fields manually.",
        },
        { status: 422 }
      );
    }

    const client = getLLMClient();
    const model = getModelId();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a product analyst helping a founder onboard to a growth tool. Read scraped marketing copy and infer concrete answers for an onboarding form. Respond with valid JSON only.",
        },
        { role: "user", content: buildPrompt(normalizedUrl, site) },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = parseJSON<AutoFillResult>(raw);

    return Response.json({
      does: result.does ?? "",
      problem: result.problem ?? "",
      who: result.who ?? "",
    });
  } catch (err) {
    console.error("[auto-fill-product]", err);
    return Response.json(
      { error: "Failed to auto-fill from URL" },
      { status: 500 }
    );
  }
}
