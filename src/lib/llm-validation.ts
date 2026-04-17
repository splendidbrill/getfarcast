import { generateLLMText, type LLMCallOptions, type LLMTextResult } from "@/lib/llm";
import { z, type ZodType } from "zod";

export type StructuredOutputFailureCode =
  | "empty_response"
  | "invalid_json"
  | "schema_validation"
  | "completeness_failure";

export class StructuredOutputError extends Error {
  code: StructuredOutputFailureCode;
  details?: unknown;
  rawOutput?: string;

  constructor(
    code: StructuredOutputFailureCode,
    message: string,
    options?: { details?: unknown; rawOutput?: string }
  ) {
    super(message);
    this.name = "StructuredOutputError";
    this.code = code;
    this.details = options?.details;
    this.rawOutput = options?.rawOutput;
  }
}

export interface StructuredRetryContext {
  failedAttempt: number;
  nextAttempt: number;
  maxRetries: number;
  error: StructuredOutputError;
}

interface GenerateStructuredOutputOptions<T> extends LLMCallOptions {
  label: string;
  schema: ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
  maxRetries?: number;
  validate?: (data: T) => void;
  retryInstruction?: (context: StructuredRetryContext) => string;
  onRetry?: (context: StructuredRetryContext) => void | Promise<void>;
}

interface GenerateStructuredOutputResult<T> {
  data: T;
  meta: LLMTextResult;
  attemptCount: number;
  attemptMeta: LLMTextResult[];
}

function extractJsonPayload(raw: string): string {
  let cleaned = raw.trim();

  if (!cleaned) {
    throw new StructuredOutputError("empty_response", "AI returned an empty response.");
  }

  if (cleaned.includes("```")) {
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
    cleaned = fenceMatch ? fenceMatch[1].trim() : cleaned.replace(/```/g, "").trim();
  }

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const firstObject = cleaned.indexOf("{");
    const firstArray = cleaned.indexOf("[");
    const firstJsonIndex = [firstObject, firstArray]
      .filter((value) => value >= 0)
      .sort((a, b) => a - b)[0];

    if (firstJsonIndex === undefined) {
      throw new StructuredOutputError("invalid_json", "AI response did not contain a JSON object or array.", {
        rawOutput: raw,
      });
    }

    cleaned = cleaned.slice(firstJsonIndex).trim();
  }

  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const lastJsonIndex = Math.max(lastBrace, lastBracket);

  if (lastJsonIndex >= 0) {
    cleaned = cleaned.slice(0, lastJsonIndex + 1).trim();
  }

  return cleaned;
}

export function parseStructuredJson(raw: string): unknown {
  const payload = extractJsonPayload(raw);

  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new StructuredOutputError("invalid_json", "AI returned malformed JSON.", {
      details: error instanceof Error ? error.message : String(error),
      rawOutput: raw,
    });
  }
}

export function validateStructuredData<T>(
  schema: ZodType<T>,
  data: unknown,
  label: string
): T {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new StructuredOutputError("schema_validation", `${label} failed schema validation.`, {
      details: z.treeifyError(parsed.error),
    });
  }

  return parsed.data;
}

function normalizeCompletenessError(error: unknown, label: string): StructuredOutputError {
  if (error instanceof StructuredOutputError) {
    return error;
  }

  return new StructuredOutputError(
    "completeness_failure",
    error instanceof Error ? error.message : `${label} failed completeness validation.`
  );
}

function isRetryable(error: StructuredOutputError): boolean {
  return error.code !== "empty_response" || true;
}

function buildRetryPrompt(
  baseUserPrompt: string,
  context: StructuredRetryContext,
  customInstruction?: string
): string {
  const retryLines = [
    "## RETRY REQUIREMENTS",
    `Your previous response failed validation: ${context.error.message}`,
    "Return ONLY valid JSON.",
    "Do not omit any required fields.",
    "Do not include prose before or after the JSON.",
  ];

  if (customInstruction) {
    retryLines.push(customInstruction);
  }

  return `${baseUserPrompt}\n\n${retryLines.join("\n")}`;
}

export async function generateStructuredOutput<T>(
  options: GenerateStructuredOutputOptions<T>
): Promise<GenerateStructuredOutputResult<T>> {
  const {
    label,
    schema,
    systemPrompt,
    userPrompt,
    maxRetries = 0,
    validate,
    retryInstruction,
    onRetry,
    ...llmOptions
  } = options;

  const attemptMeta: LLMTextResult[] = [];
  let lastError: StructuredOutputError | null = null;

  for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex += 1) {
    const failedAttempt = attemptIndex;
    const nextAttempt = attemptIndex + 1;
    const retryContext =
      attemptIndex > 0 && lastError
        ? {
            failedAttempt,
            nextAttempt,
            maxRetries,
            error: lastError,
          }
        : null;

    const promptForAttempt = retryContext
      ? buildRetryPrompt(userPrompt, retryContext, retryInstruction?.(retryContext))
      : userPrompt;

    const meta = await generateLLMText(systemPrompt, promptForAttempt, llmOptions);
    attemptMeta.push(meta);

    try {
      if (!meta.content?.trim()) {
        throw new StructuredOutputError("empty_response", `${label} returned no content.`);
      }

      const parsedJson = parseStructuredJson(meta.content);
      const validatedData = validateStructuredData(schema, parsedJson, label);

      if (validate) {
        try {
          validate(validatedData);
        } catch (error) {
          throw normalizeCompletenessError(error, label);
        }
      }

      return {
        data: validatedData,
        meta,
        attemptCount: attemptIndex + 1,
        attemptMeta,
      };
    } catch (error) {
      const structuredError = normalizeCompletenessError(error, label);
      lastError = structuredError;

      if (attemptIndex >= maxRetries || !isRetryable(structuredError)) {
        throw structuredError;
      }

      await onRetry?.({
        failedAttempt: attemptIndex + 1,
        nextAttempt: attemptIndex + 2,
        maxRetries,
        error: structuredError,
      });
    }
  }

  throw lastError ?? new StructuredOutputError("completeness_failure", `${label} failed.`);
}