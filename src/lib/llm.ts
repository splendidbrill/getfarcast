import OpenAI from "openai";

// ==========================================
// Flexible LLM Client
// Supports OpenRouter (now) and OpenAI (later)
// ==========================================

export type LLMProvider = "openrouter" | "openai" | "azure";

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

function getConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || "openrouter") as LLMProvider;

  if (provider === "azure") {
    // For Azure Serverless Endpoints / Azure AI Studio
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

  // Default: OpenRouter
  return {
    provider: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    model: process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b",
  };
}

export function getLLMClient(): OpenAI {
  const config = getConfig();

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

export function getModelId(): string {
  return getConfig().model;
}
