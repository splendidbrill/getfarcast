import { getLLMClient, getModelId } from "@/lib/llm";
import { createClient } from "@/lib/supabase/server";
import { buildGrowthHacksSystemPrompt, buildGrowthHacksUserPrompt } from "@/lib/prompts";
import { parseJSON } from "@/lib/extractJSON";
import type { ICPProfile, GrowthHack } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { productName, productDescription, icp } = await request.json() as {
      productName: string;
      productDescription: string;
      icp: ICPProfile;
    };

    if (!productName || !icp) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const raw = completion.choices[0]?.message?.content || "";
    const result = parseJSON<{ growthHacks: GrowthHack[] }>(raw);

    return Response.json(result);
  } catch (err) {
    console.error("Growth hacks generation error:", err);
    return Response.json({ error: "Failed to generate growth hacks." }, { status: 500 });
  }
}
