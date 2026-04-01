import { getLLMClient, getModelId } from "@/lib/llm";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import type { WizardFormData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData: WizardFormData = await request.json();

    // Basic validation
    if (!formData.productName || !formData.productDescription) {
      return Response.json(
        { error: "Product name and description are required." },
        { status: 400 }
      );
    }

    const client = getLLMClient();
    const model = getModelId();

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(formData) },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 8000,
    });

    // Create a ReadableStream that forwards the SSE chunks
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    console.error("Playbook generation error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      { error: `Failed to generate playbook: ${message}` },
      { status: 500 }
    );
  }
}
