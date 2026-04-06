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

  if (config.provider === "azure") {
    try {
      const url = new URL(config.baseURL);
      const apiVersion = url.searchParams.get("api-version") || "2024-05-01-preview";
      url.searchParams.delete("api-version");
      
      let baseStr = url.toString();
      // OpenAI client automatically appends /chat/completions, so we must remove it from the base
      if (baseStr.endsWith("/chat/completions")) {
        baseStr = baseStr.substring(0, baseStr.length - 17);
      } else if (baseStr.endsWith("/chat/completions/")) {
        baseStr = baseStr.substring(0, baseStr.length - 18);
      }

      return new OpenAI({
        apiKey: config.apiKey, // Note: OpenAI client will still set Bearer, but Azure ignores it if api-key is present
        baseURL: baseStr,
        defaultQuery: { "api-version": apiVersion },
        defaultHeaders: { "api-key": config.apiKey },
      });
    } catch (e) {
      console.warn("Failed to parse AZURE_ENDPOINT. Using fallback.", e);
    }
  }

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
