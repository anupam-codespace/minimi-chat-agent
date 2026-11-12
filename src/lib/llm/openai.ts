import { ILLMProvider, LLMMessage, LLMOptions } from "./types";
import { z } from "zod";

export class OpenAIProvider implements ILLMProvider {
  name = "OpenAI-Compatible";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    model: string = "gpt-4o-mini",
    baseUrl: string = "https://api.openai.com/v1"
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async generateText(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const formattedMessages = [...messages];
    if (options?.systemInstruction) {
      formattedMessages.unshift({ role: "system", content: options.systemInstruction });
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(options?.timeoutMs || 25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *streamText(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<string> {
    const formattedMessages = [...messages];
    if (options?.systemInstruction) {
      formattedMessages.unshift({ role: "system", content: options.systemInstruction });
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
      }),
      signal: AbortSignal.timeout(options?.timeoutMs || 45000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API streaming error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error("No response body from stream");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          if (trimmed === "data: [DONE]") return;

          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // ignore non-json keepalive lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generateStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodSchema<T>,
    options?: LLMOptions
  ): Promise<T> {
    const formattedMessages = [...messages];
    const jsonInstruction =
      "CRITICAL: Respond ONLY with a valid JSON object matching the requested schema. Do not include markdown codeblocks or extra text.";

    if (options?.systemInstruction) {
      formattedMessages.unshift({
        role: "system",
        content: `${options.systemInstruction}\n\n${jsonInstruction}`,
      });
    } else {
      formattedMessages.unshift({ role: "system", content: jsonInstruction });
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.1,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(options?.timeoutMs || 25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API structured generation error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";

    try {
      const parsed = JSON.parse(rawText);
      return schema.parse(parsed);
    } catch (parseErr) {
      throw new Error(`Failed to parse structured JSON: ${String(parseErr)}. Raw output: ${rawText}`);
    }
  }
}

