import { ILLMProvider, LLMMessage, LLMOptions } from "./types";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { config } from "../config";
import { z } from "zod";

class UnconfiguredLLMProvider implements ILLMProvider {
  name = "Unconfigured";

  async generateText(_messages: LLMMessage[], _options?: LLMOptions): Promise<string> {
    throw new Error(
      "No LLM API key configured. Please set GEMINI_API_KEY (recommended) or OPENAI_API_KEY in your .env.local file or Settings."
    );
  }

  async *streamText(_messages: LLMMessage[], _options?: LLMOptions): AsyncIterable<string> {
    throw new Error(
      "No LLM API key configured. Please configure GEMINI_API_KEY or OPENAI_API_KEY in .env.local or via Settings."
    );
  }

  async generateStructured<T>(
    _messages: LLMMessage[],
    _schema: z.ZodSchema<T>,
    _options?: LLMOptions
  ): Promise<T> {
    throw new Error(
      "No LLM API key configured. Structured inference requires GEMINI_API_KEY or OPENAI_API_KEY."
    );
  }
}

export function getLLMProvider(): ILLMProvider {
  if (config.llmProvider === "gemini" && config.geminiApiKey) {
    return new GeminiProvider(config.geminiApiKey, config.geminiModel);
  }

  if (config.llmProvider === "openai" && config.openaiApiKey) {
    return new OpenAIProvider(config.openaiApiKey, config.openaiModel);
  }

  if (config.llmProvider === "groq" && config.groqApiKey) {
    return new OpenAIProvider(
      config.groqApiKey,
      config.groqModel,
      "https://api.groq.com/openai/v1"
    );
  }

  // Fallbacks if any key is available
  if (config.geminiApiKey) {
    return new GeminiProvider(config.geminiApiKey, config.geminiModel);
  }
  if (config.openaiApiKey) {
    return new OpenAIProvider(config.openaiApiKey, config.openaiModel);
  }

  return new UnconfiguredLLMProvider();
}

export * from "./types";

