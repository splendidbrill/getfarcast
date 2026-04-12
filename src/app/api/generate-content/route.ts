import { getLLMClient, getModelId, callAzureLLM, getProvider } from "@/lib/llm";
import {
  buildPostsCalendarSystemPrompt,
  buildPostsCalendarUserPrompt,
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
      // Just naively fix the JSON using jsonrepair
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
        const { playbookId, selectedChannels } = body;

        if (!playbookId || !selectedChannels || !selectedChannels.length) {
          throw new Error("Missing playbookId or selected channels.");
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

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

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 1,
          label: "Writing post calendar (cadence-matched per platform)...",
          status: "running",
        });

        // 2. Generate Content
        // Use higher token limit since we may generate posts for many platforms
        const postsCalendar = await callLLMWithTokens(
          buildPostsCalendarSystemPrompt(selectedChannels),
          buildPostsCalendarUserPrompt(playbook.icp, formData, selectedChannels),
          8000
        );

        playbook.postsCalendar = postsCalendar;
        storedData.playbook = playbook;

        // 3. Save to Supabase
        const { error: saveError } = await supabase
          .from("playbooks")
          .update({ data: storedData })
          .eq("id", playbookId)
          .eq("user_id", user.id);

        if (saveError) {
          console.error("Supabase Save Error:", saveError);
        } else {
          console.log(`Content for ${playbook.id} saved successfully.`);
        }

        encodeEvent(controller, encoder, "progress", {
          step: 1,
          total: 1,
          label: "Post calendar ready",
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
