import OpenAI from "openai";

// ==========================================
// Flexible LLM Client
// Supports OpenRouter (now) and OpenAI (later)
// ==========================================

export type LLMProvider = "openrouter" | "openai";

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

function getConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || "openrouter") as LLMProvider;

  if (provider === "openai") {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY || "",
      baseURL: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o",
    };
  }

  // Default: OpenRouter
  return {
    provider: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b",
  };
}

let clientInstance: OpenAI | null = null;

export function getLLMClient(): OpenAI {
  if (clientInstance) return clientInstance;

  const config = getConfig();

  clientInstance = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: {
      ...(config.provider === "openrouter" && {
        "HTTP-Referer": "https://getfarcast.com",
        "X-Title": "GetFarcast",
      }),
    },
  });

  return clientInstance;
}

export function getModelId(): string {
  return getConfig().model;
}
