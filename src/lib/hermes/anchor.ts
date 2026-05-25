import { createClient as createAdminClient } from "@supabase/supabase-js";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type AnchorType = "competitor_weakness" | "industry_trend";

export interface DailyAnchor {
  text: string;
  type: AnchorType;
  sourceRef: string;
  weaknessFingerprint: string;
}

const COOLDOWN_DAYS = 7;

async function getUsedFingerprints(userId: string, playbookId: string): Promise<Set<string>> {
  const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString();
  const { data } = await admin()
    .from("anchor_history")
    .select("weakness_fingerprint")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .gte("used_at", cutoff);
  return new Set((data ?? []).map((r: { weakness_fingerprint: string }) => r.weakness_fingerprint));
}

async function pickCompetitorAnchor(
  userId: string,
  playbookId: string,
  used: Set<string>
): Promise<DailyAnchor | null> {
  const { data } = await admin()
    .from("competitor_intel")
    .select("id, competitor_url, top_weaknesses, marketing_angle")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .not("top_weaknesses", "is", null);

  if (!data?.length) return null;

  const pool: { text: string; sourceRef: string; fingerprint: string }[] = [];

  for (const comp of data) {
    const weaknesses: string[] = comp.top_weaknesses ?? [];
    weaknesses.forEach((w: string, i: number) => {
      const fp = `${comp.id}:${i}`;
      if (!used.has(fp)) {
        pool.push({
          text: `Competitor weakness to attack today: "${w}" (from ${comp.competitor_url}). Their core positioning: ${comp.marketing_angle ?? "unclear"}.`,
          sourceRef: comp.id as string,
          fingerprint: fp,
        });
      }
    });
  }

  if (!pool.length) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { text: pick.text, type: "competitor_weakness", sourceRef: pick.sourceRef, weaknessFingerprint: pick.fingerprint };
}

async function pickTrendAnchor(
  userId: string,
  playbookId: string,
  industry: string,
  used: Set<string>
): Promise<DailyAnchor> {
  const query = `${industry} founder challenges problems ${new Date().getFullYear()}`
    .replace(/[\r\n\t"'()[\]{}]+/g, " ").trim().slice(0, 120);

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": process.env.SERPER_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 8, tbs: "qdr:w" }),
      signal: AbortSignal.timeout(12_000),
    });

    if (res.ok) {
      const json = await res.json();
      const organic: Array<{ title: string; snippet?: string; link: string }> = json.organic ?? [];

      for (const result of organic) {
        const fp = `serper:${result.link}`;
        if (!used.has(fp)) {
          const anchorText = `Industry trend to capitalize on today: "${result.title}". ${result.snippet ?? ""}`.slice(0, 400);
          await admin().from("trend_intel").insert({
            user_id: userId,
            playbook_id: playbookId,
            headline: result.title,
            snippet: result.snippet ?? "",
            source_url: result.link,
          });
          return { text: anchorText, type: "industry_trend", sourceRef: "serper", weaknessFingerprint: fp };
        }
      }
    }
  } catch {
    // Serper failed — fall through to generic
  }

  const fp = `generic:${industry}:${Math.floor(Date.now() / 86_400_000)}`;
  return {
    text: `The ${industry} space is forcing founders to ship features their customers never asked for. Attack the feature bloat narrative today.`,
    type: "industry_trend",
    sourceRef: "generic",
    weaknessFingerprint: fp,
  };
}

export async function generateAnchor(
  userId: string,
  playbookId: string,
  industry: string
): Promise<DailyAnchor> {
  const used = await getUsedFingerprints(userId, playbookId);
  const competitorAnchor = await pickCompetitorAnchor(userId, playbookId, used);
  if (competitorAnchor) return competitorAnchor;
  return pickTrendAnchor(userId, playbookId, industry, used);
}

export async function recordAnchorUsed(
  userId: string,
  playbookId: string,
  anchor: DailyAnchor
): Promise<string | null> {
  const { data } = await admin()
    .from("anchor_history")
    .insert({
      user_id: userId,
      playbook_id: playbookId,
      anchor_text: anchor.text,
      anchor_type: anchor.type,
      source_ref: anchor.sourceRef,
      weakness_fingerprint: anchor.weaknessFingerprint,
    })
    .select("id")
    .single();
  return data?.id ?? null;
}
