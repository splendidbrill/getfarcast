import type { LLMTextResult } from "@/lib/llm";
import {
  buildPostsCalendarSystemPrompt,
  buildPostsCalendarUserPrompt,
  buildWeekNPostsCalendarUserPrompt,
  getPostCountForPlatform,
  type PreviousWeekFeedback,
} from "@/lib/prompts";
import { loadPlatforms } from "@/lib/platforms/loader";
import {
  assemblePostsCalendar,
  assertPostsCalendarBatch,
  finalizePostsCalendarBatch,
} from "@/lib/content-generation";
import { generateStructuredOutput } from "@/lib/llm-validation";
import {
  PlaybookSchema,
  PostsCalendarSchema,
  StoredPlaybookSchema,
} from "@/lib/llm-schemas";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel higher timeout

function encodeEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  type: string,
  data: any
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
}

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

function findPlatformCadence(channelName: string): string {
  const platforms = loadPlatforms();
  const normalizedChannel = channelName.toLowerCase().replace(/[^a-z0-9]/g, "");

  const platform = platforms.find((entry) => {
    const normalizedEntry = entry.channel.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      normalizedEntry === normalizedChannel ||
      normalizedEntry.includes(normalizedChannel) ||
      normalizedChannel.includes(normalizedEntry)
    );
  });

  return platform?.algorithm_playbook?.optimal_posting_cadence || "";
}

function getBatchMaxTokens(expectedPostCount: number): number {
  return Math.min(8000, Math.max(2500, expectedPostCount * 1200));
}

// ─────────────────────────────────────────────────────────────
// Server-side gate validation (mirrors client-side checkWeekGate)
// Returns an error string if the request should be blocked, or
// null if it's allowed to proceed.
// ─────────────────────────────────────────────────────────────
function validateWeekGate(
  weeks: any[],
  targetWeek: number
): { blocked: true; reason: string; hoursRemaining?: number; feedbackNeeded?: number } | null {
  const prevWeekIndex = targetWeek - 2; // 0-based
  const prevWeek = weeks[prevWeekIndex];
  if (!prevWeek) {
    return { blocked: true, reason: `Week ${targetWeek - 1} has not been generated yet.` };
  }

  // Time gate
  const week1 = weeks[0];
  const anchorTs = targetWeek === 2 ? prevWeek.generatedAt : week1?.generatedAt;
  if (anchorTs) {
    const anchorMs = new Date(anchorTs).getTime();
    const nowMs = Date.now();
    const requiredMs =
      targetWeek === 2
        ? 24 * 60 * 60 * 1000       // 24 hours
        : 10 * 24 * 60 * 60 * 1000; // 10 days
    const elapsed = nowMs - anchorMs;
    if (elapsed < requiredMs) {
      const hoursRemaining = Math.ceil((requiredMs - elapsed) / (60 * 60 * 1000));
      return {
        blocked: true,
        reason: `Time gate: you need to wait ${hoursRemaining} more hour${hoursRemaining !== 1 ? "s" : ""} before generating Week ${targetWeek}.`,
        hoursRemaining,
      };
    }
  }

  // Feedback gate
  const posts: any[] = prevWeek.posts || [];
  const totalPosts = posts.length;
  const minimumRequired = Math.max(1, Math.ceil(totalPosts * 0.1));
  const feedbackGiven = posts.filter(
    (p: any) => p.feedbackRating !== undefined && p.feedbackRating !== null
  ).length;
  if (feedbackGiven < minimumRequired) {
    const feedbackNeeded = minimumRequired - feedbackGiven;
    return {
      blocked: true,
      reason: `Feedback gate: you need to rate at least ${feedbackNeeded} more post${feedbackNeeded !== 1 ? "s" : ""} from Week ${targetWeek - 1} before generating Week ${targetWeek}.`,
      feedbackNeeded,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Build structured feedback context from previous weeks
// ─────────────────────────────────────────────────────────────
function buildFeedbackContext(weeks: any[]): PreviousWeekFeedback[] {
  return weeks.map((week, idx) => {
    const posts: any[] = week.posts || [];

    // Group by platform
    const platformMap: Record<string, { fire: string[]; ok: string[]; flop: string[]; postTypes: { type: string; rating: string }[] }> = {};
    for (const post of posts) {
      if (!platformMap[post.platform]) {
        platformMap[post.platform] = { fire: [], ok: [], flop: [], postTypes: [] };
      }
      const entry = platformMap[post.platform];
      if (post.feedbackRating === "fire") entry.fire.push(post.hook);
      else if (post.feedbackRating === "ok") entry.ok.push(post.hook);
      else if (post.feedbackRating === "flop") entry.flop.push(post.hook);
      if (post.feedbackRating) {
        entry.postTypes.push({ type: post.postType, rating: post.feedbackRating });
      }
    }

    const platformBreakdown = Object.entries(platformMap).map(([platform, data]) => ({
      platform,
      ...data,
    }));

    const allHooks = posts.map((p: any) => p.hook).filter(Boolean);
    const userComments = posts
      .map((p: any) => p.feedbackComments)
      .filter((c: any) => typeof c === "string" && c.trim().length > 0);

    return {
      weekNumber: week.weekNumber || idx + 1,
      platformBreakdown,
      allHooks,
      userComments,
    };
  });
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const requestBodySchema = z
    .object({
      playbookId: z.string().trim().min(1),
      selectedChannels: z.array(z.string().trim().min(1)).min(1),
      weekNumber: z.coerce.number().int().min(1).default(1),
    })
    .strict();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. SET UP THE HEARTBEAT PING
      const heartbeat = setInterval(() => {
        try {
          // Send a tiny ping every 10 seconds to keep the connection alive
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 10000);

      function cleanup() {
        clearInterval(heartbeat); // 2. CLEAR IT WHEN DONE
        try {
          controller.close();
        } catch (e) {
          /* ignore */
        }
      }

      try {
        const body = await req.json();
        const parsedBody = requestBodySchema.safeParse(body);

        if (!parsedBody.success) {
          throw new Error("Missing or invalid playbookId, selected channels, or week number.");
        }

        const { playbookId, weekNumber } = parsedBody.data;
        const selectedChannels = Array.from(new Set(parsedBody.data.selectedChannels));

        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Unauthorized");
        }

        // 1. Fetch existing playbook
        const { data: playbookRecord, error: fetchErr } = await supabase
          .from("playbooks")
          .select("data")
          .eq("id", playbookId)
          .eq("user_id", user.id)
          .single();

        if (fetchErr || !playbookRecord) {
          throw new Error("Playbook not found");
        }

        const storedData = playbookRecord.data;
        const normalizedStoredData = {
          playbook:
            storedData && typeof storedData === "object" && "playbook" in storedData
              ? (storedData as { playbook: unknown }).playbook
              : storedData,
          formData:
            storedData && typeof storedData === "object" && "formData" in storedData
              ? (storedData as { formData: unknown }).formData
              : undefined,
        };

        const storedPlaybookResult = StoredPlaybookSchema.safeParse(normalizedStoredData);

        if (!storedPlaybookResult.success) {
          throw new Error("Stored playbook is invalid or incomplete.");
        }

        const { playbook, formData } = storedPlaybookResult.data;

        const knownChannels = new Set(playbook.channels.map((channel) => channel.name));
        const unknownChannels = selectedChannels.filter((channel) => !knownChannels.has(channel));

        if (unknownChannels.length > 0) {
          throw new Error(`Unknown channels requested: ${unknownChannels.join(", ")}.`);
        }

        // Normalize postsCalendar to array
        let weeksArray = Array.isArray(playbook.postsCalendar) ? playbook.postsCalendar : [];

        // 2. Server-side gate validation for Week 2+
        if (weekNumber > 1) {
          const gateError = validateWeekGate(weeksArray, weekNumber);
          if (gateError) {
            encodeEvent(controller, encoder, "gate_error", gateError);
            cleanup();
            return;
          }
        }

        const previousWeeksFeedback = weekNumber > 1 ? buildFeedbackContext(weeksArray) : [];
        const validatedBatches = [];

        for (let index = 0; index < selectedChannels.length; index += 1) {
          const channel = selectedChannels[index];
          const expectedPostCount = getPostCountForPlatform(
            channel,
            findPlatformCadence(channel)
          );

          encodeEvent(controller, encoder, "progress", {
            step: index + 1,
            total: selectedChannels.length,
            label:
              weekNumber === 1
                ? `Writing ${channel} content batch...`
                : `Analysing previous performance and writing ${channel} batch...`,
            status: "running",
          });

          const systemPrompt = buildPostsCalendarSystemPrompt([channel], weekNumber);
          const userPrompt =
            weekNumber === 1
              ? buildPostsCalendarUserPrompt(playbook.icp, formData, [channel], weekNumber)
              : buildWeekNPostsCalendarUserPrompt(
                playbook.icp,
                formData,
                [channel],
                weekNumber,
                previousWeeksFeedback
              );

          const batchResult = await generateStructuredOutput({
            label: `${channel} week ${weekNumber} post batch`,
            schema: PostsCalendarSchema,
            systemPrompt,
            userPrompt,
            maxTokens: getBatchMaxTokens(expectedPostCount),
            maxRetries: 2,
            validate: (batch) => {
              assertPostsCalendarBatch(batch, {
                channel,
                expectedPostCount,
                weekNumber,
              });
            },
            retryInstruction: () =>
              [
                `Generate posts for ${channel} only.`,
                `Return exactly ${expectedPostCount} posts.`,
                `Use weekNumber ${weekNumber}.`,
                "Do not include any other platform.",
              ].join("\n"),
            onRetry: ({ failedAttempt, nextAttempt, error }) => {
              encodeEvent(controller, encoder, "retry", {
                channel,
                failedAttempt,
                nextAttempt,
                reason: error.message,
              });
            },
          });

          emitProviderNotices(controller, encoder, batchResult.attemptMeta);
          validatedBatches.push(
            finalizePostsCalendarBatch(batchResult.data, {
              channel,
              expectedPostCount,
              weekNumber,
            })
          );

          encodeEvent(controller, encoder, "progress", {
            step: index + 1,
            total: selectedChannels.length,
            label: `${channel} batch validated`,
            status: "done",
          });
        }

        const postsCalendar = PostsCalendarSchema.parse(
          assemblePostsCalendar(weekNumber, validatedBatches)
        );

        // 5. Update the weeks array
        if (weekNumber === 1) {
          weeksArray = [postsCalendar];
        } else {
          const existingIdx = weeksArray.findIndex(
            (w: any) => (w.weekNumber || 1) === weekNumber
          );
          if (existingIdx >= 0) {
            weeksArray[existingIdx] = postsCalendar;
          } else {
            weeksArray.push(postsCalendar);
          }
        }

        const updatedPlaybook = PlaybookSchema.parse({
          ...playbook,
          postsCalendar: weeksArray,
        });

        // 6. Save to Supabase
        const { error: saveError } = await supabase
          .from("playbooks")
          .update({ data: { playbook: updatedPlaybook, formData } })
          .eq("id", playbookId)
          .eq("user_id", user.id);

        if (saveError) {
          throw new Error(`Failed to save content: ${saveError.message}`);
        }

        console.log(`Week ${weekNumber} content for ${playbookId} saved successfully.`);

        encodeEvent(controller, encoder, "progress", {
          step: selectedChannels.length,
          total: selectedChannels.length,
          label: `Week ${weekNumber} post calendar ready`,
          status: "done",
        });

        encodeEvent(controller, encoder, "complete", {
          playbook: updatedPlaybook,
          formData,
        });
        cleanup();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Content generation error:", message);
        encodeEvent(controller, encoder, "error", { message });
        cleanup();
      }
    },
    cancel() {
      // Stream cancelled by browser (tab closed)
      console.log("Stream cancelled by client");
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
