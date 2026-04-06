import { getLLMClient, getModelId, callAzureLLM, getProvider } from "@/lib/llm";
import {
  buildICPSystemPrompt,
  buildICPUserPrompt,
  buildChannelSystemPrompt,
  buildChannelUserPrompt,
  buildOutreachSystemPrompt,
  buildOutreachUserPrompt,
  buildMarketSizingSystemPrompt,
  buildMarketSizingUserPrompt,
  buildPostsCalendarSystemPrompt,
  buildPostsCalendarUserPrompt,
} from "@/lib/prompts";
import { jsonrepair } from "jsonrepair";
import { matchChannels } from "@/lib/channelMatcher";
import { getChannelPlaybook } from "@/lib/knowledgeBase";
import type { WizardFormData, ICPProfile, Playbook } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ==========================================
// Helper: call LLM and parse JSON response
// ==========================================
async function callLLM(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const provider = getProvider();

  let raw: string;

  if (provider === "azure") {
    // Azure AI Foundry: use raw fetch (SDK mangles the URL)
    raw = await callAzureLLM(systemPrompt, userPrompt);
  } else {
    // OpenRouter / OpenAI: use the OpenAI SDK
    const client = getLLMClient();
    const model = getModelId();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 4000,
      timeout: 120000, // 2 minutes
    });
    raw = completion.choices[0]?.message?.content || "";
  }

  // ── Normalize the raw response 
  raw = raw.trim();

  // 1. Strip markdown code fences (```json...``` or ```...```)
  if (raw.includes("```")) {
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) {
      raw = fenceMatch[1].trim();
    } else {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
  }

  // 2. If model prefaced JSON with prose ("Here is the JSON: {...}"),
  //    find the first { or [ and slice from there.
  if (!raw.startsWith("{") && !raw.startsWith("[")) {
    const objIdx = raw.indexOf("{");
    const arrIdx = raw.indexOf("[");
    let startIdx = -1;
    if (objIdx === -1) startIdx = arrIdx;
    else if (arrIdx === -1) startIdx = objIdx;
    else startIdx = Math.min(objIdx, arrIdx);
    if (startIdx !== -1) raw = raw.slice(startIdx);
  }

  // 3. Trim trailing prose after the last closing brace/bracket
  const lastBrace = raw.lastIndexOf("}");
  const lastBracket = raw.lastIndexOf("]");
  const endIdx = Math.max(lastBrace, lastBracket);
  if (endIdx !== -1 && endIdx < raw.length - 1) {
    raw = raw.slice(0, endIdx + 1);
  }

  // 4. Sanitize illegal control characters inside JSON string values
  raw = raw.replace(
    /"((?:[^"\\]|\\.)*)"/g,
    (_match, inner: string) => {
      const sanitized = inner
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
      return `"${sanitized}"`;
    }
  );

  try {
    const repaired = jsonrepair(raw.trim());
    return JSON.parse(repaired);
  } catch (parseError) {
    console.error("\n\n====== [FATAL LLM JSON ERROR] ======\n");
    console.error(raw);
    console.error("\n====================================\n\n");
    throw new Error("AI returned malformed JSON that could not be repaired. Please retry.");
  }
}

// ==========================================
// SSE helper: write a structured event to the stream
// ==========================================
function encodeEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  type: string,
  data: unknown
) {
  const payload = JSON.stringify({ type, data });
  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
}

// ==========================================
// POST /api/generate-playbook
// Multi-step SSE orchestration pipeline
// ==========================================
export async function POST(request: Request) {
  const formData: WizardFormData = await request.json();

  if (!formData.productName || !formData.productDescription) {
    return Response.json(
      { error: "Product name and description are required." },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // â”€â”€ STEP 1: Generate ICP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 5,
          label: "Profiling your ideal customer...",
          status: "running",
        });

        const icp = (await callLLM(
          buildICPSystemPrompt(),
          buildICPUserPrompt(formData)
        )) as ICPProfile;

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 5,
          label: "ICP identified",
          status: "done",
          preview: icp.title,
        });

        // â”€â”€ STEP 2: Channel Matching (deterministic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        encodeEvent(controller, encoder, "progress", {
          step: 2,
          total: 5,
          label: "Matching distribution channels...",
          status: "running",
        });

        const matchedChannels = matchChannels(
          icp,
          formData.industry || formData.productDescription,
          formData.pricingModel
        );

        encodeEvent(controller, encoder, "progress", {
          step: 2,
          total: 5,
          label: "Channels matched",
          status: "done",
          preview: matchedChannels.map((c) => c.name).join(", "),
        });

        let feedbackContextStr = "";

        if (formData.previousPlaybookId) {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: pastData } = await supabase
              .from("playbooks")
              .select("data")
              .eq("id", formData.previousPlaybookId)
              .eq("user_id", user.id)
              .single();

            if (pastData && pastData.data) {
              const pbData = pastData.data.playbook || pastData.data;
              const feedbackEntries: string[] = [];
              pbData.channels?.forEach((ch: any) => {
                ch.contentCalendar?.forEach((post: any) => {
                  if (post.feedbackRating || post.feedbackComments) {
                    feedbackEntries.push(
                      `- Post Title: "${post.title}"\n  Rating given: ${post.feedbackRating || 'none'}\n  Comments from audience/user: "${post.feedbackComments || 'none'}"`
                    );
                  }
                });
              });
              if (feedbackEntries.length > 0) {
                feedbackContextStr = feedbackEntries.join("\n\n");
                console.log("Injected Feedback Context!");
              }
            }
          }
        }

        // â”€â”€ STEP 3: Channel Strategies (sequential, KB-injected) â”€â”€â”€â”€â”€â”€
        const channelStrategies = [];

        for (let i = 0; i < matchedChannels.length; i++) {
          const ch = matchedChannels[i];
          const kb = await getChannelPlaybook(ch.name);

          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 4,
            label: `Writing ${ch.name} strategy (expert rules applied)...`,
            status: "running",
            substep: `${i + 1}/${matchedChannels.length}`,
          });

          let systemPrompt: string;
          if (kb) {
            systemPrompt = buildChannelSystemPrompt(ch.name, kb);
          } else {
            // Fallback if no KB file exists for this channel
            systemPrompt = buildChannelSystemPrompt(
              ch.name,
              `No specific playbook available. Generate a comprehensive strategy based on your knowledge of ${ch.name} best practices for early-stage startups. Apply the general principles of value-first content, audience-specific tone, and anti-slop rules.`
            );
          }

          const strategy = await callLLM(
            systemPrompt,
            buildChannelUserPrompt(icp, formData, ch.name, i + 1, ch.pushType, feedbackContextStr)
          ) as Record<string, unknown>;

          channelStrategies.push({
            ...strategy,
            rank: i + 1,
            fitScore: ch.score,
            pushType: ch.pushType,
          });

          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 4,
            label: `${ch.name} strategy ready`,
            status: i + 1 === matchedChannels.length ? "done" : "partial",
            substep: `${i + 1}/${matchedChannels.length}`,
          });
        }

        // â”€â”€ STEP 4: Outreach + Market Sizing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          label: "Writing outreach sequences...",
          status: "running",
        });

        const [outreach, marketSizing] = await Promise.all([
          callLLM(
            buildOutreachSystemPrompt(),
            buildOutreachUserPrompt(
              icp,
              formData,
              matchedChannels.slice(0, 3).map((c) => c.name)
            )
          ),
          callLLM(
            buildMarketSizingSystemPrompt(),
            buildMarketSizingUserPrompt(icp, formData)
          ),
        ]);

        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 5,
          label: "Playbook complete",
          status: "done",
        });

        // â”€â”€ STEP 5: 7-Day Ready-to-Post Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        encodeEvent(controller, encoder, "progress", {
          step: 5,
          total: 5,
          label: "Writing your 7-day post calendar...",
          status: "running",
        });

        // Only generate posts for text-heavy social/content platforms (skip visual-only like Instagram/TikTok/YouTube)
        const postChannels = matchedChannels
          .map((c) => c.name)
          .filter((name) =>
            ["Reddit", "LinkedIn", "X", "Twitter/X", "Twitter", "Facebook", "Hacker News", "Product Hunt"].includes(name)
          );
        const calendarChannels = postChannels.length > 0 ? postChannels : matchedChannels.slice(0, 3).map((c) => c.name).filter(name => !["Instagram", "TikTok", "YouTube"].includes(name));

        const postsCalendar = await callLLM(
          buildPostsCalendarSystemPrompt(calendarChannels),
          buildPostsCalendarUserPrompt(icp, formData, calendarChannels)
        );

        encodeEvent(controller, encoder, "progress", {
          step: 5,
          total: 5,
          label: "7-day post calendar ready",
          status: "done",
        });

        // â”€â”€ Assemble final playbook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const id = crypto.randomUUID().slice(0, 8);
        const playbook: Playbook = {
          id,
          createdAt: new Date().toISOString(),
          productName: formData.productName,
          summary: `GetFarcast has identified your ideal customer as "${icp.title}" and mapped ${channelStrategies.length} distribution channels with expert-level strategy for each. Your top channel is ${matchedChannels[0]?.name}, followed by ${matchedChannels[1]?.name}.`,
          icp,
          marketSizing: marketSizing as Playbook["marketSizing"],
          channels: channelStrategies as Playbook["channels"],
          outreach: outreach as Playbook["outreach"],
          postsCalendar: postsCalendar as Playbook["postsCalendar"],
        };

        // â”€â”€ Save to Supabase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        try {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            const { error: dbError } = await supabase.from("playbooks").insert({
              id: playbook.id,
              user_id: user.id,
              product_name: playbook.productName,
              data: { playbook, formData },
            });
            if (dbError) {
              console.error("Supabase insert error:", dbError);
            }
          }
        } catch (dbErr) {
          console.error("Failed to save playbook to DB:", dbErr);
        }

        // Send the final playbook
        encodeEvent(controller, encoder, "complete", { playbook, formData });

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Pipeline error:", message);
        encodeEvent(controller, encoder, "error", { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
