import type { ProviderInfo } from "@/lib/types";

interface ProviderDefinition {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModelEnv: string;
  defaultModel: string;
  models: string[];
}

export const providerDefinitions: ProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4.1-mini",
    models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    defaultModelEnv: "DEEPSEEK_MODEL",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"]
  },
  {
    id: "dashscope",
    name: "通义千问",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKeyEnv: "DASHSCOPE_API_KEY",
    defaultModelEnv: "DASHSCOPE_MODEL",
    defaultModel: "qwen-plus",
    models: ["qwen-plus", "qwen-max", "qwen-turbo"]
  }
];

export function listProviders(): ProviderInfo[] {
  return providerDefinitions.map((provider) => ({
    id: provider.id,
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKeyEnv: provider.apiKeyEnv,
    defaultModel: process.env[provider.defaultModelEnv] || provider.defaultModel,
    configured: Boolean(process.env[provider.apiKeyEnv]),
    models: provider.models
  }));
}

export function getProviderInfo(providerId: string): ProviderInfo {
  return listProviders().find((provider) => provider.id === providerId) ?? listProviders()[0];
}

export async function testProviderConnection(input: {
  providerId: string;
  model?: string;
}) {
  const definition = providerDefinitions.find((provider) => provider.id === input.providerId);
  if (!definition) {
    return {
      ok: false,
      configured: false,
      providerId: input.providerId,
      providerName: input.providerId,
      model: input.model || "",
      latencyMs: 0,
      message: `Unsupported provider: ${input.providerId}`
    };
  }

  const model = input.model || process.env[definition.defaultModelEnv] || definition.defaultModel;
  if (!process.env[definition.apiKeyEnv]) {
    return {
      ok: false,
      configured: false,
      providerId: definition.id,
      providerName: definition.name,
      model,
      apiKeyEnv: definition.apiKeyEnv,
      latencyMs: 0,
      message: `Missing ${definition.apiKeyEnv}. Add it to .env and restart the local server.`
    };
  }

  const startedAt = Date.now();
  try {
    const sample = await callChatCompletion({
      providerId: definition.id,
      model,
      temperature: 0,
      messages: [
        { role: "system", content: "Reply with OK only." },
        { role: "user", content: "connection test" }
      ]
    });

    return {
      ok: true,
      configured: true,
      providerId: definition.id,
      providerName: definition.name,
      model,
      latencyMs: Date.now() - startedAt,
      sample: sample.slice(0, 80),
      message: "Provider connection succeeded."
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      providerId: definition.id,
      providerName: definition.name,
      model,
      latencyMs: Date.now() - startedAt,
      message: sanitizeDiagnosticMessage(error instanceof Error ? error.message : "Provider connection failed.")
    };
  }
}

function sanitizeDiagnosticMessage(message: string) {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+\/=:-]+/g, "Bearer [redacted]")
    .replace(/[A-Z0-9_]*API_KEY/g, "API Key");
}

export async function callChatCompletion(input: {
  providerId: string;
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
}): Promise<string> {
  const definition = providerDefinitions.find((provider) => provider.id === input.providerId);
  if (!definition) {
    throw new Error(`不支持的 AI 供应商：${input.providerId}`);
  }

  const apiKey = process.env[definition.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`缺少 ${definition.apiKeyEnv}，请在本地 .env 中配置后重启服务。`);
  }

  const model = input.model || process.env[definition.defaultModelEnv] || definition.defaultModel;
  const response = await fetch(`${definition.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      temperature: input.temperature ?? 0.35
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${definition.name} 调用失败：${response.status} ${detail.slice(0, 500)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${definition.name} 没有返回可用内容。`);
  }
  return content;
}
