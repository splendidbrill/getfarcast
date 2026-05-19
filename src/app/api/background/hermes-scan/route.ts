import { load } from "cheerio";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getLLMClient, getModelId } from "@/lib/llm";
import { parseJSON } from "@/lib/extractJSON";
import { withBrowser, withIsolatedPage } from "@/lib/agent/browserService";
import { getBurnerSession, markBurnerBanned, isPaidUser } from "@/lib/agent/burnerSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

// ── Reddit scan (free + paid) ─────────────────────────────────────────────────

async function runRedditScan(
  userId: string,
  subreddits: string[],
  playbookId: string
): Promise<number> {
  const client = getLLMClient();
  const model = getModelId();
  let saved = 0;

  for (const sub of subreddits.slice(0, 3)) {
    try {
      const res = await fetch(
        `https://old.reddit.com/r/${sub}/top/?sort=top&t=day`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; Farcast/1.0)" },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) continue;

      const $ = load(await res.text());
      const posts: string[] = [];
      $("div.thing").slice(0, 15).each((_, el) => {
        const title = $(el).find("a.title").first().text().trim();
        const score = $(el).attr("data-score") ?? "0";
        if (title) posts.push(`[${score}pts] ${title}`);
      });
      if (posts.length === 0) continue;

      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "Extract community intelligence from Reddit posts. Return valid JSON only.",
          },
          {
            role: "user",
            content: `r/${sub} top posts today:\n${posts.join("\n")}\n\nReturn: {"trends":[],"complaints":[],"contentAngles":[]}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const brief = parseJSON(completion.choices[0]?.message?.content ?? "{}");

      await admin().from("reddit_intel").insert({
        user_id: userId,
        playbook_id: playbookId,
        subreddit: sub,
        posts_scraped: posts.length,
        brief,
      });

      saved++;
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      continue;
    }
  }
  return saved;
}

// ── Competitor social scan (paid only) ────────────────────────────────────────

async function scanCompetitorSocial(
  userId: string,
  playbookId: string,
  competitorUrl: string
): Promise<void> {
  const linkedinSession = await getBurnerSession("linkedin");

  await withBrowser(async (browser) => {
    // Check competitor LinkedIn if we have a burner session
    if (linkedinSession) {
      try {
        const posts = await withIsolatedPage(
          browser,
          async (page) => {
            await page.goto(competitorUrl, {
              waitUntil: "domcontentloaded",
              timeout: 25000,
            });

            return page
              .$$eval(
                ".feed-shared-update-v2__description, .update-components-text",
                (els) =>
                  els
                    .slice(0, 5)
                    .map((el) => el.textContent?.trim() ?? "")
                    .filter(Boolean)
              )
              .catch(() => [] as string[]);
          },
          linkedinSession.cookies
        );

        if (posts.length > 0) {
          const client = getLLMClient();
          const model = getModelId();

          const completion = await client.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You write counter-marketing content. Return valid JSON only.",
              },
              {
                role: "user",
                content: `New competitor LinkedIn posts:\n${posts.join("\n---\n")}\n\nGenerate a counter post:\n{"platform":"linkedin","content":"<150-word LinkedIn post>","angle":"<one line>"}`,
              },
            ],
            temperature: 0.65,
            max_tokens: 400,
          });

          const draft = parseJSON<{
            platform: string;
            content: string;
            angle: string;
          }>(completion.choices[0]?.message?.content ?? "{}");

          if (draft.content) {
            const scheduled = new Date();
            scheduled.setHours(9, 0, 0, 0);
            scheduled.setDate(scheduled.getDate() + 1);

            await admin().from("content_queue").insert({
              user_id: userId,
              playbook_id: playbookId,
              content: draft.content,
              platform: "linkedin",
              scheduled_for: scheduled.toISOString(),
              status: "draft",
              source: "hermes",
            });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("blocked") || msg.includes("authwall")) {
          await markBurnerBanned(linkedinSession.id);
        }
      }
    }
  }, true); // useProxy = true for paid scans
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { reddit: 0, competitorScans: 0, draftsCreated: 0, errors: 0 };

  try {
    const { data: playbooks } = await admin()
      .from("playbooks")
      .select("id, user_id, data")
      .limit(50);

    if (!playbooks?.length) {
      return Response.json({ ...results, message: "No playbooks found" });
    }

    for (const pb of playbooks) {
      try {
        const data = (pb.data ?? {}) as Record<string, unknown>;
        const playbookInner = (data.playbook ?? data) as Record<string, unknown>;
        const icp = (playbookInner.icp ?? {}) as Record<string, unknown>;

        // Extract subreddits from playbook data
        const subMatches =
          JSON.stringify(data).match(/r\/[A-Za-z0-9_]+/g) ?? [];
        const subreddits = [
          ...new Set(subMatches.map((s) => s.replace("r/", ""))),
        ].slice(0, 3);

        if (subreddits.length > 0) {
          const saved = await runRedditScan(pb.user_id, subreddits, pb.id);
          results.reddit += saved;
        }

        // Check if user is paid
        const { data: authData } = await admin().auth.admin.getUserById(pb.user_id);
        const subStatus =
          authData?.user?.app_metadata?.subscription_status ?? null;

        if (isPaidUser(subStatus)) {
          // Get competitor watchlist from previous scans
          const { data: competitors } = await admin()
            .from("competitor_intel")
            .select("competitor_url, linkedin_url")
            .eq("user_id", pb.user_id)
            .eq("playbook_id", pb.id)
            .limit(5);

          for (const comp of competitors ?? []) {
            try {
              await scanCompetitorSocial(pb.user_id, pb.id, comp.competitor_url);
              results.competitorScans++;
            } catch {
              results.errors++;
            }
          }
        }
      } catch {
        results.errors++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (err) {
    console.error("[hermes-scan]", err);
    return Response.json({ error: "Hermes scan failed", ...results }, { status: 500 });
  }
}
