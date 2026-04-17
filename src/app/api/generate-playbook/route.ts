import { generateLLMText, type LLMTextResult } from "@/lib/llm";
import {
  buildICPSystemPrompt,
  buildICPUserPrompt,
  buildChannelSystemPrompt,
  buildChannelUserPrompt,
  buildOutreachSystemPrompt,
  buildOutreachUserPrompt,
  buildMarketSizingSystemPrompt,
  buildMarketSizingUserPrompt,
} from "@/lib/prompts";
import { matchChannels } from "@/lib/channelMatcher";
import { getChannelPlaybook } from "@/lib/knowledgeBase";
import { generateStructuredOutput } from "@/lib/llm-validation";
import {
  ChannelStrategyLLMSchema,
  ICPProfileSchema,
  MarketSizingSchema,
  OutreachSequenceSchema,
  PlaybookSchema,
  WizardFormDataSchema,
} from "@/lib/llm-schemas";
import type { ChannelStrategy, WizardFormData } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function emitProviderNotice(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  meta: LLMTextResult
) {
  if (!meta.notice) return;

  encodeEvent(controller, encoder, "notice", {
    message: meta.notice,
    provider: meta.provider,
    fallbackUsed: meta.fallbackUsed,
    scrubbedInput: meta.scrubbedInput,
  });
}

function emitProviderNotices(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  metaList: LLMTextResult[]
) {
  for (const meta of metaList) {
    emitProviderNotice(controller, encoder, meta);
  }
}

function buildPlaybookSummary(productName: string, channelStrategies: ChannelStrategy[]): string {
  const [topChannel, secondChannel] = channelStrategies;

  if (!topChannel) {
    return `${productName} playbook generated successfully.`;
  }

  if (!secondChannel) {
    return `GetFarcast identified your best-fit distribution channel as ${topChannel.name} (${topChannel.fitScore}%).`;
  }

  return `GetFarcast matched ${channelStrategies.length} distribution channels. Your top channels are ${topChannel.name} (${topChannel.fitScore}%) and ${secondChannel.name} (${secondChannel.fitScore}%).`;
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
  const requestBody = await request.json();
  const formDataResult = WizardFormDataSchema.safeParse(requestBody);

  if (!formDataResult.success) {
    return Response.json(
      { error: "Invalid playbook request payload." },
      { status: 400 }
    );
  }

  const formData: WizardFormData = formDataResult.data;

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
          total: 4,
          label: "Profiling your ideal customer...",
          status: "running",
        });

        if (signal.aborted) return cleanup();
        const icpResult = await generateStructuredOutput({
          label: "ICP profile",
          schema: ICPProfileSchema,
          systemPrompt: buildICPSystemPrompt(),
          userPrompt: buildICPUserPrompt(formData),
          maxTokens: 4000,
          maxRetries: 1,
        });
        emitProviderNotices(controller, encoder, icpResult.attemptMeta);
        const icp = icpResult.data;

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 4,
          label: "ICP identified",
          status: "done",
          preview: icp.title,
        });

        // -- STEP 2: Channel Matching (deterministic, genuine scoring) -------------
        encodeEvent(controller, encoder, "progress", {
          step: 2,
          total: 4,
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
          total: 4,
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
        const channelStrategies: ChannelStrategy[] = [];

        for (let i = 0; i < matchedChannels.length; i++) {
          if (signal.aborted) return cleanup();
          const ch = matchedChannels[i];

          // Fetch strategy for ALL matched channels
          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 4,
            label: `Writing ${ch.name} strategy (expert rules applied)...`,
            status: "running",
            substep: `${i + 1}/${matchedChannels.length}`,
          });

          const kb = await getChannelPlaybook(ch.name);
          const systemPrompt = kb
            ? buildChannelSystemPrompt(ch.name, kb)
            : buildChannelSystemPrompt(
                ch.name,
                `No specific playbook available. Generate a comprehensive strategy based on your knowledge of ${ch.name} best practices for early-stage startups.`
              );

          const strategyResult = await generateStructuredOutput({
            label: `${ch.name} strategy`,
            schema: ChannelStrategyLLMSchema,
            systemPrompt,
            userPrompt: buildChannelUserPrompt(
              icp,
              formData,
              ch.name,
              i + 1,
              ch.pushType,
              feedbackContextStr
            ),
            maxTokens: 4000,
            maxRetries: 1,
          });
          emitProviderNotices(controller, encoder, strategyResult.attemptMeta);
          const strategy = strategyResult.data;

          channelStrategies.push({
            ...strategy,
            rank: i + 1,
            fitScore: ch.score,
            pushType: ch.pushType,
            contentCalendar: [],
          });

          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 4,
            label: `${ch.name} recognized`,
            status: i + 1 === matchedChannels.length ? "done" : "partial",
            substep: `${i + 1}/${matchedChannels.length}`,
          });
        }

        // -- STEP 4: Outreach + Market Sizing (parallel) --------------------------
        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          label: "Writing outreach sequences + market sizing...",
          status: "running",
        });

        if (signal.aborted) return cleanup();
        const [outreachResult, marketSizingResult] = await Promise.all([
          generateStructuredOutput({
            label: "Outreach sequence",
            schema: OutreachSequenceSchema,
            systemPrompt: buildOutreachSystemPrompt(),
            userPrompt: buildOutreachUserPrompt(
              icp,
              formData,
              matchedChannels.slice(0, 3).map((c) => c.name)
            ),
            maxTokens: 4000,
            maxRetries: 1,
          }),
          generateStructuredOutput({
            label: "Market sizing",
            schema: MarketSizingSchema,
            systemPrompt: buildMarketSizingSystemPrompt(),
            userPrompt: buildMarketSizingUserPrompt(icp, formData),
            maxTokens: 4000,
            maxRetries: 1,
          }),
        ]);
        emitProviderNotices(controller, encoder, outreachResult.attemptMeta);
        emitProviderNotices(controller, encoder, marketSizingResult.attemptMeta);
        const outreach = outreachResult.data;
        const marketSizing = marketSizingResult.data;

        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          label: "Outreach and market sizing ready",
          status: "done",
        });


        // -- Assemble final playbook ----------------------------------------------
        const id = crypto.randomUUID();
        const playbook = PlaybookSchema.parse({
          id,
          createdAt: new Date().toISOString(),
          productName: formData.productName,
          summary: buildPlaybookSummary(formData.productName, channelStrategies),
          icp,
          marketSizing,
          channels: channelStrategies,
          outreach,
          postsCalendar: [],
        });

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
