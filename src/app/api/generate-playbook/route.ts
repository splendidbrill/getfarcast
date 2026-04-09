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
// Helper: normalise + JSON-parse an LLM response string
// ==========================================
function parseJsonResponse(raw: string): unknown {
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

  // 2. Strip any leading prose before the first { or [
  if (!raw.startsWith("{") && !raw.startsWith("[")) {
    const objIdx = raw.indexOf("{");
    const arrIdx = raw.indexOf("[");
    let startIdx = -1;
    if (objIdx === -1) startIdx = arrIdx;
    else if (arrIdx === -1) startIdx = objIdx;
    else startIdx = Math.min(objIdx, arrIdx);
    if (startIdx !== -1) raw = raw.slice(startIdx);
  }

  // 3. Trim trailing prose after the last } or ]
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
// Helper: call LLM and parse JSON response (default 4000 tokens)
// ==========================================
async function callLLM(systemPrompt: string, userPrompt: string): Promise<unknown> {
  return callLLMWithTokens(systemPrompt, userPrompt, 4000);
}

// ==========================================
// Helper: call LLM with a custom max_tokens budget
// Used for the posts calendar which can be much larger when
// many platforms are matched.
// ==========================================
async function callLLMWithTokens(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<unknown> {
  const provider = getProvider();
  let raw: string;

  if (provider === "azure") {
    raw = await callAzureLLM(systemPrompt, userPrompt);
  } else {
    const client = getLLMClient();
    const model = getModelId();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    raw = completion.choices[0]?.message?.content || "";
  }

  return parseJsonResponse(raw);
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
  try {
    const payload = JSON.stringify({ type, data });
    controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
  } catch (err) {
    // Controller already closed or cancelled
    console.warn(`Could not encode event ${type}:`, err);
  }
}

function safeClose(controller: ReadableStreamDefaultController) {
  try {
    controller.close();
  } catch (err) {
    // Already closed
  }
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
  const signal = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      // HEARTBEAT: Send a tiny ping every 5 seconds to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 5000);

      const cleanup = () => {
        clearInterval(heartbeat);
        safeClose(controller);
      };

      try {
        if (signal.aborted) return cleanup();

        // -- STEP 1: Generate ICP --------------------------------------------------
        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 5,
          label: "Profiling your ideal customer...",
          status: "running",
        });

        if (signal.aborted) return cleanup();
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

        // -- STEP 2: Channel Matching (deterministic, genuine scoring) -------------
        encodeEvent(controller, encoder, "progress", {
          step: 2,
          total: 5,
          label: "Matching distribution channels...",
          status: "running",
        });

        if (signal.aborted) return cleanup();
        // Returns ALL channels with genuine fit score > 50
        const matchedChannels = matchChannels(
          icp,
          formData.industry || formData.productDescription,
          formData.pricingModel
        );

        encodeEvent(controller, encoder, "progress", {
          step: 2,
          total: 5,
          label: `${matchedChannels.length} channels identified.`,
          status: "done",
          preview: matchedChannels.slice(0, 5).map((c) => `${c.name} (${c.score}%)`).join(", ") + (matchedChannels.length > 5 ? "..." : ""),
        });

        // -- Feedback context (from previous playbook if provided) -----------------
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
                      `- Post Title: "${post.title}"\n  Rating given: ${post.feedbackRating || "none"}\n  Comments from audience/user: "${post.feedbackComments || "none"}"`
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

        // -- STEP 3: Channel Strategies (sequential, KB-injected) -----------------
        const channelStrategies = [];

        for (let i = 0; i < matchedChannels.length; i++) {
          if (signal.aborted) return cleanup();
          const ch = matchedChannels[i];

          // NEW: Only generate full AI content for the top 3 channels to save costs
          const isTopThree = i < 3;

          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 5,
            label: isTopThree 
              ? `Writing ${ch.name} strategy (expert rules applied)...`
              : `Recognizing ${ch.name} as a match...`,
            status: "running",
            substep: `${i + 1}/${matchedChannels.length}`,
          });

          if (isTopThree) {
            const kb = await getChannelPlaybook(ch.name);
            const systemPrompt = kb
              ? buildChannelSystemPrompt(ch.name, kb)
              : buildChannelSystemPrompt(
                  ch.name,
                  `No specific playbook available. Generate a comprehensive strategy based on your knowledge of ${ch.name} best practices for early-stage startups.`
                );

            const strategy = (await callLLM(
              systemPrompt,
              buildChannelUserPrompt(icp, formData, ch.name, i + 1, ch.pushType, feedbackContextStr)
            )) as Record<string, unknown>;

            channelStrategies.push({
              ...strategy,
              rank: i + 1,
              fitScore: ch.score,
              pushType: ch.pushType,
            });
          } else {
            // Skeleton strategy for non-top-3 channels
            channelStrategies.push({
              name: ch.name,
              rank: i + 1,
              fitScore: ch.score,
              pushType: ch.pushType,
              rationale: `Matched as a high-potential growth channel with a ${ch.score}% fit score. Strategy generation skipped for cost optimization (Only top 3 channels are fully analyzed).`,
              audienceSize: "Matched",
              engagementRate: "Profiled",
              accessibility: "free",
              algorithmInsights: [],
              bestPractices: [],
              antiPatterns: [],
              contentCalendar: []
            });
          }

          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 5,
            label: `${ch.name} recognized`,
            status: i + 1 === matchedChannels.length ? "done" : "partial",
            substep: `${i + 1}/${matchedChannels.length}`,
          });
        }

        // -- STEP 4: Outreach + Market Sizing (parallel) --------------------------
        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 5,
          label: "Writing outreach sequences + market sizing...",
          status: "running",
        });

        if (signal.aborted) return cleanup();
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
          label: "Outreach and market sizing ready",
          status: "done",
        });

        // -- STEP 5: Post Calendar (cadence-matched per platform) -----------------
        // ALL matched channels get posts generated, each with the correct number
        // of posts based on optimal_posting_cadence from the platform JSON.
        encodeEvent(controller, encoder, "progress", {
          step: 5,
          total: 5,
          label: "Writing post calendar (cadence-matched per platform)...",
          status: "running",
        });

        if (signal.aborted) return cleanup();
        // Post calendar ONLY for the top 3 channels to save tokens
        const calendarChannels = matchedChannels.slice(0, 3).map((c) => c.name);

        // Use higher token limit since we may generate posts for many platforms
        const postsCalendar = await callLLMWithTokens(
          buildPostsCalendarSystemPrompt(calendarChannels),
          buildPostsCalendarUserPrompt(icp, formData, calendarChannels),
          8000
        );

        encodeEvent(controller, encoder, "progress", {
          step: 5,
          total: 5,
          label: "Post calendar ready",
          status: "done",
        });

        // -- Assemble final playbook ----------------------------------------------
        const id = crypto.randomUUID();
        const playbook: Playbook = {
          id,
          createdAt: new Date().toISOString(),
          productName: formData.productName,
          summary: `GetFarcast identified your ideal customer as "${icp.title}" and matched ${channelStrategies.length} distribution channels (all with genuine fit scores above 50%). Your top channel is ${matchedChannels[0]?.name} (${matchedChannels[0]?.score}%), followed by ${matchedChannels[1]?.name} (${matchedChannels[1]?.score}%).`,
          icp,
          marketSizing: marketSizing as Playbook["marketSizing"],
          channels: channelStrategies as Playbook["channels"],
          outreach: outreach as Playbook["outreach"],
          postsCalendar: postsCalendar as Playbook["postsCalendar"],
        };

        // -- SAVE TO SUPABASE  -----------------------------------------------------
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error: saveError } = await supabase
            .from("playbooks")
            .insert({
              id: playbook.id,
              user_id: user.id,
              product_name: playbook.productName,
              data: { playbook, formData },
              created_at: playbook.createdAt,
            });

          if (saveError) {
            console.error("Supabase Save Error:", saveError);
            // We still want to send the complete event so the user doesn't lose data
          } else {
            console.log(`Playbook ${playbook.id} saved to Supabase successfully.`);
          }
        }

        if (signal.aborted) return cleanup();
        encodeEvent(controller, encoder, "complete", { playbook, formData });
        cleanup();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Pipeline error:", message);
        encodeEvent(controller, encoder, "error", { message });
        cleanup();
      }
    },
    cancel() {
      // Stream cancelled by browser (tab closed)
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
