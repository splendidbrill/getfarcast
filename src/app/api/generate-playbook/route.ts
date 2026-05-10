import { getLLMClient, getModelId } from "@/lib/llm";
import {
  buildICPSystemPrompt,
  buildICPUserPrompt,
  buildChannelSystemPrompt,
  buildChannelUserPrompt,
  buildMarketSizingSystemPrompt,
  buildMarketSizingUserPrompt,
} from "@/lib/prompts";
import { matchChannels } from "@/lib/channelMatcher";
import { getChannelPlaybook } from "@/lib/knowledgeBase";
import type { WizardFormData, ICPProfile, Playbook } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { parseJSON } from "@/lib/extractJSON";
import { checkAndIncrementUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

// ==========================================
// Helper: call LLM and parse JSON response
// ==========================================
async function callLLM(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const client = getLLMClient();
  const model = getModelId();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 8000,
  });

  const raw = completion.choices[0]?.message?.content || "";
  return parseJSON<Record<string, unknown>>(raw);
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

  // Resolve the user BEFORE opening the SSE stream. Once streaming starts,
  // Supabase's cookie-based session refresh can't write Set-Cookie headers,
  // so auth.getUser() inside the stream can silently return null on long runs.
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Admin client bypasses cookie refresh entirely — safe to use inside the stream.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const usageCheck = await checkAndIncrementUsage(userId, "playbooks", 1, user.email ?? undefined);
  if (!usageCheck.allowed) {
    return Response.json({ error: usageCheck.error }, { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── STEP 1: Generate ICP ──────────────────────────────────────
        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 4,
          label: "Profiling your ideal customer...",
          status: "running",
        });

        const icp = (await callLLM(
          buildICPSystemPrompt(),
          buildICPUserPrompt(formData)
        )) as ICPProfile;

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 4,
          label: "ICP identified",
          status: "done",
          preview: icp.title,
        });

        // ── STEP 2: Channel Matching (deterministic) ─────────────────
        encodeEvent(controller, encoder, "progress", {
          step: 2,
          total: 4,
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
          total: 4,
          label: "Channels matched",
          status: "done",
          preview: matchedChannels.map((c) => c.name).join(", "),
        });

        let feedbackContextStr = "";

        if (formData.previousPlaybookId) {
          const { data: pastData } = await admin
            .from("playbooks")
            .select("data")
            .eq("id", formData.previousPlaybookId)
            .eq("user_id", userId)
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

        // ── STEP 3: Channel Strategies (parallel, KB-injected) ───────
        // Kick off all channel LLM calls simultaneously. With 10 channels
        // this reduces wall-clock time from ~15 min (sequential) to ~1-2 min
        // (bounded by the slowest single call).
        encodeEvent(controller, encoder, "progress", {
          step: 3,
          total: 4,
          label: `Writing strategies for all ${matchedChannels.length} channels (expert rules applied)...`,
          status: "running",
          substep: `0/${matchedChannels.length}`,
        });

        let completedCount = 0;

        const channelStrategyPromises = matchedChannels.map(async (ch, i) => {
          const kb = await getChannelPlaybook(ch.name);

          const systemPrompt = kb
            ? buildChannelSystemPrompt(ch.name, kb)
            : buildChannelSystemPrompt(
                ch.name,
                `No specific playbook available. Generate a comprehensive strategy based on your knowledge of ${ch.name} best practices for early-stage startups. Apply the general principles of value-first content, audience-specific tone, and anti-slop rules.`
              );

          const strategy = (await callLLM(
            systemPrompt,
            buildChannelUserPrompt(icp, formData, ch.name, i + 1, ch.pushType, feedbackContextStr)
          )) as Record<string, unknown>;

          completedCount++;
          encodeEvent(controller, encoder, "progress", {
            step: 3,
            total: 4,
            label: `${ch.name} strategy ready`,
            status: completedCount === matchedChannels.length ? "done" : "partial",
            substep: `${completedCount}/${matchedChannels.length}`,
          });

          return {
            ...strategy,
            rank: i + 1,
            fitScore: ch.score,
            pushType: ch.pushType,
          };
        });

        // Wait for all channels. Use allSettled so one failure doesn't abort everything.
        const settled = await Promise.allSettled(channelStrategyPromises);
        const channelStrategies = settled
          .map((result, i) => {
            if (result.status === "fulfilled") return result.value;
            console.error(`Channel ${matchedChannels[i].name} strategy failed:`, result.reason);
            // Return a minimal placeholder so the playbook still renders
            return {
              name: matchedChannels[i].name,
              rank: i + 1,
              fitScore: matchedChannels[i].score,
              pushType: matchedChannels[i].pushType,
              rationale: "Strategy generation failed for this channel.",
              contentCalendar: [],
            };
          });

        // ── STEP 4: Market Sizing ────────────────────────────────────
        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          label: "Sizing the market...",
          status: "running",
        });

        const marketSizing = await callLLM(
          buildMarketSizingSystemPrompt(),
          buildMarketSizingUserPrompt(icp, formData)
        );

        encodeEvent(controller, encoder, "progress", {
          step: 4,
          total: 4,
          label: "Playbook complete",
          status: "done",
        });

        // ── Assemble final playbook ───────────────────────────────────
        const id = crypto.randomUUID();
        const playbook: Playbook = {
          id,
          createdAt: new Date().toISOString(),
          productName: formData.productName,
          summary: `GetFarcast has identified your ideal customer as "${icp.title}" and mapped ${channelStrategies.length} distribution channels with expert-level strategy for each. Your top channel is ${matchedChannels[0]?.name}, followed by ${matchedChannels[1]?.name}.`,
          icp,
          marketSizing: marketSizing as Playbook["marketSizing"],
          channels: channelStrategies as Playbook["channels"],
        };

        // ── Save to Supabase ──────────────────────────────────────────
        // Use admin client with captured userId — avoids mid-stream cookie refresh.
        try {
          const { error: dbError } = await admin.from("playbooks").insert({
            id: playbook.id,
            user_id: userId,
            product_name: playbook.productName,
            data: { playbook, formData },
          });
          if (dbError) {
            console.error("Supabase insert error:", dbError);
            encodeEvent(controller, encoder, "warning", {
              message: `Playbook generated but failed to save: ${dbError.message}`,
            });
          }
        } catch (dbErr) {
          const msg = dbErr instanceof Error ? dbErr.message : "Unknown DB error";
          console.error("Failed to save playbook to DB:", msg);
          encodeEvent(controller, encoder, "warning", {
            message: `Playbook generated but failed to save: ${msg}`,
          });
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
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
