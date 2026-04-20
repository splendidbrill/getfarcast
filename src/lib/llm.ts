import OpenAI, { AzureOpenAI } from "openai";

// ==========================================
// Flexible LLM Client
// Supports OpenRouter, OpenAI, and Azure OpenAI
// ==========================================

export type LLMProvider = "openrouter" | "openai" | "azure";

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL?: string;
  model: string;
  azureEndpoint?: string;
  azureApiVersion?: string;
}

function getConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || "openrouter") as LLMProvider;

  if (provider === "azure") {
    return {
      provider: "azure",
      apiKey: process.env.AZURE_API_KEY || "",
      model: process.env.AZURE_MODEL || "gpt-4o",
      azureEndpoint: process.env.AZURE_ENDPOINT || "",
      azureApiVersion: process.env.AZURE_API_VERSION || "2024-08-01-preview",
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

let clientInstance: OpenAI | AzureOpenAI | null = null;

export function getLLMClient(): OpenAI {
  if (clientInstance) return clientInstance as OpenAI;

  const config = getConfig();

  if (config.provider === "azure") {
    clientInstance = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.azureEndpoint,
      apiVersion: config.azureApiVersion,
      deployment: config.model,
    });
    return clientInstance as unknown as OpenAI;
  }

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
