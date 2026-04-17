import OpenAI from "openai";

// ==========================================
// Flexible LLM Client
// Supports Azure AI Foundry, OpenRouter, OpenAI
// ==========================================

export type LLMProvider = "openrouter" | "openai" | "azure";
type OpenAICompatibleProvider = Extract<LLMProvider, "openrouter" | "openai">;

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface LLMCallOptions {
  maxTokens?: number;
  allowFallback?: boolean;
}

export interface LLMTextResult {
  content: string;
  provider: LLMProvider;
  requestedProvider: LLMProvider;
  model: string;
  fallbackUsed: boolean;
  scrubbedInput: boolean;
  notice?: string;
}

interface PromptScrubResult {
  systemPrompt: string;
  userPrompt: string;
  scrubbedInput: boolean;
}

const DEFAULT_MAX_TOKENS = 4000;
const AZURE_TIMEOUT_MS = 120000;
const AZURE_FALLBACK_ORDER: OpenAICompatibleProvider[] = ["openrouter", "openai"];

const AZURE_INPUT_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bgrowth hack\b/gi, replacement: "growth strategy" },
  { pattern: /\bgrowth hacking\b/gi, replacement: "growth experimentation" },
  { pattern: /\bgrowth hacker\b/gi, replacement: "growth operator" },
  { pattern: /\bhack the algorithm\b/gi, replacement: "improve distribution performance" },
  { pattern: /\bviral hack\b/gi, replacement: "viral growth strategy" },
  { pattern: /\bblack hat\b/gi, replacement: "aggressive" },
  { pattern: /\bdominate the market\b/gi, replacement: "compete strongly in the market" },
  { pattern: /\bexploit\b/gi, replacement: "use effectively" },
];

class AzureLLMError extends Error {
  status: number;
  body: string;
  isPolicyViolation: boolean;

  constructor(status: number, body: string) {
    super(`Azure LLM error ${status}: ${body}`);
    this.name = "AzureLLMError";
    this.status = status;
    this.body = body;
    this.isPolicyViolation = isAzurePolicyViolation(status, body);
  }
}

function getConfig(provider: LLMProvider = getProvider()): LLMConfig {
  if (provider === "azure") {
    return {
      provider: "azure",
      apiKey: process.env.AZURE_API_KEY || "",
      baseURL: process.env.AZURE_ENDPOINT || "",
      model: process.env.AZURE_MODEL || "grok-4-1-fast-reasoning",
    };
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY || "",
      baseURL: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }

  return {
    provider: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b",
  };
}

function hasUsableConfig(provider: LLMProvider): boolean {
  const config = getConfig(provider);
  if (!config.apiKey) return false;
  if (provider === "azure" && !config.baseURL) return false;
  return true;
}

function getFallbackProviders(): OpenAICompatibleProvider[] {
  return AZURE_FALLBACK_ORDER.filter((provider) => hasUsableConfig(provider));
}

function scrubAzureText(input: string): { text: string; changed: boolean } {
  let text = input;
  let changed = false;

  for (const rule of AZURE_INPUT_REPLACEMENTS) {
    if (rule.pattern.test(text)) {
      text = text.replace(rule.pattern, rule.replacement);
      changed = true;
    }
  }

  return { text, changed };
}

function scrubAzurePrompts(systemPrompt: string, userPrompt: string): PromptScrubResult {
  const scrubbedSystem = scrubAzureText(systemPrompt);
  const scrubbedUser = scrubAzureText(userPrompt);

  return {
    systemPrompt: scrubbedSystem.text,
    userPrompt: scrubbedUser.text,
    scrubbedInput: scrubbedSystem.changed || scrubbedUser.changed,
  };
}

function buildOpenAIClient(provider: OpenAICompatibleProvider): OpenAI {
  const config = getConfig(provider);

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: {
      ...(config.provider === "openrouter" && {
        "HTTP-Referer": "https://getfarcast.com",
        "X-Title": "GetFarcast",
      }),
    },
  });
}

function buildAzureUrl(config: LLMConfig): string {
  let urlStr = config.baseURL;

  try {
    const urlObj = new URL(urlStr);

    if (
      urlObj.hostname.includes("cognitiveservices.azure.com") ||
      urlObj.hostname.includes("openai.azure.com")
    ) {
      urlObj.pathname = `/openai/deployments/${config.model}/chat/completions`;
      if (!urlObj.searchParams.has("api-version")) {
        urlObj.searchParams.set("api-version", "2024-02-15-preview");
      }
    } else {
      if (!urlObj.pathname.endsWith("/chat/completions")) {
        urlObj.pathname = urlObj.pathname.replace(/\/$/, "") + "/chat/completions";
      }
      if (!urlObj.searchParams.has("api-version")) {
        urlObj.searchParams.set("api-version", "2024-05-01-preview");
      }
    }

    urlStr = urlObj.toString();
  } catch {
    // Let fetch fail natively if the configured URL is invalid.
  }

  return urlStr;
}

function isAzureReasoningModel(model: string): boolean {
  const lowerModel = model.toLowerCase();
  return (
    lowerModel.includes("o1") ||
    lowerModel.includes("o3") ||
    lowerModel.includes("deepseek") ||
    lowerModel.includes("gpt-5")
  );
}

function isAzurePolicyViolation(status: number, body: string): boolean {
  if (status !== 400) return false;

  return /ResponsibleAIPolicyViolation|content.?filter|policy.?violation|safety/i.test(body);
}

// ==========================================
// Azure AI Foundry: use raw fetch (SDK mangles the URL)
// ==========================================
export async function callAzureLLM(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {}
): Promise<string> {
  const config = getConfig("azure");
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const urlStr = buildAzureUrl(config);

  console.log(`[LLM] Azure call → endpoint: ${urlStr}`);
  console.log(`[LLM] Azure model: ${config.model}`);

  const bodyData: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  };

  if (isAzureReasoningModel(config.model)) {
    bodyData.max_completion_tokens = maxTokens;
  } else {
    bodyData.max_tokens = maxTokens;
    bodyData.temperature = 0.6;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AZURE_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(urlStr, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify(bodyData),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Azure LLM request timed out after 2 minutes");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  console.log(`[LLM] Azure response status: ${response.status}`);

  if (!response.ok) {
    const errText = await response.text();
    console.error("[LLM] Azure error body:", errText);
    throw new AzureLLMError(response.status, errText);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  console.log("[LLM] Azure response received successfully");
  return data.choices[0]?.message?.content || "";
}

async function callOpenAICompatibleLLM(
  provider: OpenAICompatibleProvider,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const client = buildOpenAIClient(provider);
  const config = getConfig(provider);

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function generateLLMText(
  systemPrompt: string,
  userPrompt: string,
  options: LLMCallOptions = {}
): Promise<LLMTextResult> {
  const requestedProvider = getProvider();
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  if (requestedProvider !== "azure") {
    const content = await callOpenAICompatibleLLM(requestedProvider, systemPrompt, userPrompt, maxTokens);
    const config = getConfig(requestedProvider);

    return {
      content,
      provider: requestedProvider,
      requestedProvider,
      model: config.model,
      fallbackUsed: false,
      scrubbedInput: false,
    };
  }

  const scrubbed = scrubAzurePrompts(systemPrompt, userPrompt);

  try {
    const content = await callAzureLLM(scrubbed.systemPrompt, scrubbed.userPrompt, { maxTokens });
    const config = getConfig("azure");

    return {
      content,
      provider: "azure",
      requestedProvider,
      model: config.model,
      fallbackUsed: false,
      scrubbedInput: scrubbed.scrubbedInput,
      notice: scrubbed.scrubbedInput
        ? "Azure-sensitive marketing phrasing was softened before generation."
        : undefined,
    };
  } catch (error) {
    if (error instanceof AzureLLMError && error.isPolicyViolation && (options.allowFallback ?? true)) {
      const fallbackProvider = getFallbackProviders()[0];

      if (!fallbackProvider) {
        throw new Error(
          "Azure blocked this request for safety reasons, and no fallback provider is configured. Please rephrase the request or configure OpenRouter/OpenAI."
        );
      }

      const content = await callOpenAICompatibleLLM(
        fallbackProvider,
        scrubbed.systemPrompt,
        scrubbed.userPrompt,
        maxTokens
      );
      const fallbackConfig = getConfig(fallbackProvider);

      return {
        content,
        provider: fallbackProvider,
        requestedProvider,
        model: fallbackConfig.model,
        fallbackUsed: true,
        scrubbedInput: scrubbed.scrubbedInput,
        notice: `Azure rejected this request due to provider safety filtering. The request was retried on ${fallbackProvider} and completed successfully.`,
      };
    }

    throw error;
  }
}

// ==========================================
// OpenAI / OpenRouter client
// ==========================================
export function getLLMClient(): OpenAI {
  const resolvedProvider = getProvider();
  const provider: OpenAICompatibleProvider = resolvedProvider === "azure" ? "openrouter" : resolvedProvider;
  return buildOpenAIClient(provider);
}

export function getModelId(): string {
  return getConfig().model;
}

export function getProvider(): LLMProvider {
  const configuredProvider = process.env.LLM_PROVIDER;

  if (configuredProvider === "azure" || configuredProvider === "openai" || configuredProvider === "openrouter") {
    return configuredProvider;
  }

  return "openrouter";
}
