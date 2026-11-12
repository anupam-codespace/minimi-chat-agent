import { ILLMProvider, LLMMessage, LLMOptions } from "./types";
import { z } from "zod";

export class GeminiProvider implements ILLMProvider {
  name = "Google Gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  private buildContents(messages: LLMMessage[]) {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const m of messages) {
      if (m.role === "system") continue; // system instruction handled separately
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }

    return contents;
  }

  private getSystemInstruction(messages: LLMMessage[], options?: LLMOptions) {
    const sysMsg = messages.find((m) => m.role === "system");
    const instruction = options?.systemInstruction || sysMsg?.content;
    if (!instruction) return undefined;
    return {
      parts: [{ text: instruction }],
    };
  }

  async generateText(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const systemInstruction = this.getSystemInstruction(messages, options);
    const contents = this.buildContents(messages);

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options?.timeoutMs || 25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: { text: string }) => p.text).join("") || "";
    return text;
  }

  async *streamText(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<string> {
    const systemInstruction = this.getSystemInstruction(messages, options);
    const contents = this.buildContents(messages);

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options?.timeoutMs || 45000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API streaming error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error("No response body from Gemini stream");

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
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("");
            if (text) {
              yield text;
            }
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
    const systemInstruction = this.getSystemInstruction(messages, options);
    const contents = this.buildContents(messages);

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        temperature: options?.temperature ?? 0.1,
        responseMimeType: "application/json",
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options?.timeoutMs || 25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API structured generation error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawText =
      data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join("") || "{}";

    try {
      const parsed = JSON.parse(rawText);
      return schema.parse(parsed);
    } catch (parseErr) {
      throw new Error(`Failed to parse structured JSON from LLM: ${String(parseErr)}. Raw output: ${rawText}`);
    }
  }
}

