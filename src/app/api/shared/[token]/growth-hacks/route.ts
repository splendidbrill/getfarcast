import { createClient } from "@supabase/supabase-js";
import { getLLMClient, getModelId } from "@/lib/llm";
import { buildGrowthHacksSystemPrompt, buildGrowthHacksUserPrompt } from "@/lib/prompts";
import { parseJSON } from "@/lib/extractJSON";
import type { GrowthHack } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: row } = await admin
    .from("playbooks")
    .select("id, data")
    .eq("share_token", token)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stored = row.data as any;

  // Return cached hacks if available
  if (Array.isArray(stored?.growthHacksCache) && stored.growthHacksCache.length > 0) {
    return NextResponse.json({ growthHacks: stored.growthHacksCache });
  }

  // Generate fresh
  const playbook = stored?.playbook ?? stored;
  const productName: string = playbook?.productName ?? "";
  const productDescription: string = playbook?.summary ?? "";
  const icp = playbook?.icp ?? {};

  try {
    const client = getLLMClient();
    const model = getModelId();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildGrowthHacksSystemPrompt() },
        { role: "user", content: buildGrowthHacksUserPrompt(productName, productDescription, icp) },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const result = parseJSON<{ growthHacks: GrowthHack[] }>(raw);
    const hacks: GrowthHack[] = (result as any)?.growthHacks ?? [];

    // Cache in the playbook row so subsequent views are fast
    if (hacks.length > 0) {
      await admin
        .from("playbooks")
        .update({ data: { ...stored, growthHacksCache: hacks } })
        .eq("id", row.id);
    }

    return NextResponse.json({ growthHacks: hacks });
  } catch (err) {
    console.error("[shared/growth-hacks] generation error", err);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
