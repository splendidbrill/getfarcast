import { createClient } from "@/lib/supabase/server";
import { getLLMClient, getModelId } from "@/lib/llm";
import { withPage } from "@/lib/agent/browserService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { companyUrl } = (await request.json()) as { companyUrl: string };

    if (!companyUrl?.trim()) {
      return Response.json({ error: "companyUrl is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const companyContext = await withPage(async (page) => {
      const targets = [companyUrl, `${companyUrl.replace(/\/$/, "")}/about`];
      let metaDesc = "";
      let h1 = "";
      let bodySnippet = "";

      for (const target of targets) {
        try {
          await page.goto(target, { waitUntil: "domcontentloaded", timeout: 20000 });
          const desc = await page
            .$eval('meta[name="description"]', (el) => el.getAttribute("content") ?? "")
            .catch(() => "");
          const heading = await page.$eval("h1", (el) => el.textContent?.trim() ?? "").catch(() => "");
          const body = await page
            .$eval("main, article, .about, #about, body", (el) => el.textContent?.slice(0, 800).trim() ?? "")
            .catch(() => "");

          if (desc) metaDesc = desc;
          if (heading && !h1) h1 = heading;
          if (body && !bodySnippet) bodySnippet = body;
          if (metaDesc && h1) break;
        } catch {
          continue;
        }
      }

      return { metaDesc, h1, bodySnippet };
    });

    if (!companyContext.metaDesc && !companyContext.h1 && !companyContext.bodySnippet) {
      return Response.json(
        { error: "Could not extract any content from the provided URL" },
        { status: 422 }
      );
    }

    const contextBlock = [
      companyContext.h1 && `Company headline: ${companyContext.h1}`,
      companyContext.metaDesc && `Meta description: ${companyContext.metaDesc}`,
      companyContext.bodySnippet &&
        `About page snippet: ${companyContext.bodySnippet.slice(0, 500)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const client = getLLMClient();
    const model = getModelId();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a startup founder who writes casual, human cold DMs. You never sound salesy. You never use corporate jargon. You write like a peer, not a vendor.`,
        },
        {
          role: "user",
          content: `Write a casual, highly personalized 2-sentence cold DM based on this company's exact mission and product. Do not sound salesy. Do not use buzzwords. Reference something specific from their description. End with a low-friction question.\n\nCompany context:\n${contextBlock}\n\nOutput ONLY the DM text. No quotes. No labels. No commentary.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 150,
    });

    const dm = completion.choices[0]?.message?.content?.trim() ?? "";

    return Response.json({ dm, context: companyContext });
  } catch (err) {
    console.error("[lead-recon]", err);
    return Response.json({ error: "Failed to enrich lead" }, { status: 500 });
  }
}
