import { getLLMClient, getModelId, callAzureLLM, getProvider } from "@/lib/llm";
import {
  buildPostsCalendarSystemPrompt,
  buildPostsCalendarUserPrompt,
  buildWeekNPostsCalendarUserPrompt,
  type PreviousWeekFeedback,
} from "@/lib/prompts";
import { jsonrepair } from "jsonrepair";
import { createClient } from "@/lib/supabase/server";

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

async function callLLMWithTokens(system: string, user: string, maxTokens: number) {
  const provider = getProvider();
  if (provider === "azure") {
    const raw = await callAzureLLM(system, user);
    try {
      return JSON.parse(jsonrepair(raw));
    } catch {
      throw new Error("Failed to parse JSON from Azure OpenAI (Content Generation)");
    }
  }

  const client = getLLMClient();
  const rawResponse = await client.chat.completions.create({
    model: getModelId(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  const content = rawResponse.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI.");

  try {
    return JSON.parse(jsonrepair(content));
  } catch (err) {
    console.error("Raw LLM response (failed to parse):", content);
    throw new Error("AI returned invalid JSON.");
  }
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

  const stream = new ReadableStream({
    async start(controller) {
      function cleanup() {
        try {
          controller.close();
        } catch (e) {
          /* ignore */
        }
      }

      try {
        const body = await req.json();
        const { playbookId, selectedChannels, weekNumber = 1 } = body;

        if (!playbookId || !selectedChannels || !selectedChannels.length) {
          throw new Error("Missing playbookId or selected channels.");
        }

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
        const playbook = storedData.playbook || storedData;
        const formData = storedData.formData;

        if (!playbook || !formData) {
          throw new Error("Invalid playbook data format");
        }

        // Normalize postsCalendar to array
        let weeksArray: any[] = Array.isArray(playbook.postsCalendar)
          ? playbook.postsCalendar
          : playbook.postsCalendar
          ? [playbook.postsCalendar]
          : [];

        // 2. Server-side gate validation for Week 2+
        if (weekNumber > 1) {
          const gateError = validateWeekGate(weeksArray, weekNumber);
          if (gateError) {
            encodeEvent(controller, encoder, "gate_error", gateError);
            cleanup();
            return;
          }
        }

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 1,
          label:
            weekNumber === 1
              ? "Writing post calendar (cadence-matched per platform)..."
              : `Analysing Week ${weekNumber - 1} performance and writing Week ${weekNumber} content...`,
          status: "running",
        });

        // 3. Build prompts — week 1 uses standard prompt, week 2+ uses feedback-aware prompt
        let systemPrompt: string;
        let userPrompt: string;

        if (weekNumber === 1) {
          systemPrompt = buildPostsCalendarSystemPrompt(selectedChannels, 1);
          userPrompt = buildPostsCalendarUserPrompt(playbook.icp, formData, selectedChannels, 1);
        } else {
          // Pass all previous weeks as feedback context
          const previousWeeksFeedback = buildFeedbackContext(weeksArray);
          systemPrompt = buildPostsCalendarSystemPrompt(selectedChannels, weekNumber);
          userPrompt = buildWeekNPostsCalendarUserPrompt(
            playbook.icp,
            formData,
            selectedChannels,
            weekNumber,
            previousWeeksFeedback
          );
        }

        // 4. Generate Content
        const postsCalendar = await callLLMWithTokens(systemPrompt, userPrompt, 16000);

        // Stamp the generation time (override any AI hallucination of the timestamp)
        postsCalendar.generatedAt = new Date().toISOString();
        postsCalendar.weekNumber = weekNumber;

        // 5. Update the weeks array
        if (weekNumber === 1) {
          // Week 1: replace any existing week 1 (or initialise)
          weeksArray = [postsCalendar];
        } else {
          // Week N: replace or append
          const existingIdx = weeksArray.findIndex(
            (w: any) => (w.weekNumber || 1) === weekNumber
          );
          if (existingIdx >= 0) {
            weeksArray[existingIdx] = postsCalendar;
          } else {
            weeksArray.push(postsCalendar);
          }
        }

        playbook.postsCalendar = weeksArray;
        storedData.playbook = playbook;

        // 6. Save to Supabase
        const { error: saveError } = await supabase
          .from("playbooks")
          .update({ data: storedData })
          .eq("id", playbookId)
          .eq("user_id", user.id);

        if (saveError) {
          console.error("Supabase Save Error:", saveError);
        } else {
          console.log(`Week ${weekNumber} content for ${playbookId} saved successfully.`);
        }

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 1,
          label: `Week ${weekNumber} post calendar ready`,
          status: "done",
        });

        encodeEvent(controller, encoder, "complete", { playbook, formData });
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
