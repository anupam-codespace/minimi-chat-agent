import { z } from "zod";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  timeoutMs?: number;
}

export interface ILLMProvider {
  name: string;
  generateText(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  streamText(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<string>;
  generateStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodSchema<T>,
    options?: LLMOptions
  ): Promise<T>;
}

