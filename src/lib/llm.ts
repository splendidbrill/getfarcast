import OpenAI from "openai";

// ==========================================
// Flexible LLM Client
// Supports Azure AI Foundry, OpenRouter, OpenAI
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

// ==========================================
// Azure AI Foundry: use raw fetch (SDK mangles the URL)
// ==========================================
export async function callAzureLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const config = getConfig();
  let urlStr = config.baseURL;
  
  // Robustly handle the endpoint URL so it never 404s
  try {
    const urlObj = new URL(urlStr);
    if (!urlObj.pathname.endsWith("/chat/completions")) {
      urlObj.pathname = urlObj.pathname.replace(/\/$/, "") + "/chat/completions";
    }
    if (!urlObj.searchParams.has("api-version")) {
      urlObj.searchParams.set("api-version", "2024-05-01-preview");
    }
    urlStr = urlObj.toString();
  } catch (err) {
    // If it's totally invalid, let it fall through and fail the fetch natively
  }

  console.log(`[LLM] Azure call → endpoint: ${urlStr}`);
  console.log(`[LLM] Azure model: ${config.model}`);

  const body = JSON.stringify({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 4000,
  });

  const response = await fetch(urlStr, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    body,
  });

  console.log(`[LLM] Azure response status: ${response.status}`);

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[LLM] Azure error body:`, errText);
    throw new Error(`Azure LLM error ${response.status}: ${errText}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content || "";
}

// ==========================================
// OpenAI / OpenRouter client
// ==========================================
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

export function getProvider(): LLMProvider {
  return getConfig().provider;
}
