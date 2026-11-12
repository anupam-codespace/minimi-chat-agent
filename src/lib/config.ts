import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  appUrl: z.string().default("http://localhost:3000"),

  // Persistence
  databaseUrl: z.string().optional(),
  defaultUserId: z.string().default("usr_default"),
  defaultTimezone: z.string().default("Asia/Kolkata"),

  // LLM Provider
  llmProvider: z.enum(["gemini", "openai", "anthropic", "groq"]).default("gemini"),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().default("gemini-2.5-flash"),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().default("gpt-4o-mini"),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().default("claude-3-5-sonnet-20241022"),
  groqApiKey: z.string().optional(),
  groqModel: z.string().default("llama-3.3-70b-versatile"),

  // Search Provider
  searchProvider: z.enum(["tavily", "brave", "serper", "duckduckgo"]).default("tavily"),
  tavilyApiKey: z.string().optional(),
  braveApiKey: z.string().optional(),
  serperApiKey: z.string().optional(),

  // Budgets & Limits
  maxSearchQueries: z.coerce.number().default(3),
  maxSourcesPerQuery: z.coerce.number().default(5),
  searchTimeoutMs: z.coerce.number().default(8000),
  fetchPageTimeoutMs: z.coerce.number().default(5000),
  rateLimitMaxPerMinute: z.coerce.number().default(60),
  maxContentCharsPerPage: z.coerce.number().default(15000),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  return configSchema.parse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.APP_URL,

    databaseUrl: process.env.DATABASE_URL,
    defaultUserId: process.env.DEFAULT_USER_ID,
    defaultTimezone: process.env.DEFAULT_TIMEZONE,

    llmProvider: process.env.LLM_PROVIDER,
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL,
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL,

    searchProvider: process.env.SEARCH_PROVIDER,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    braveApiKey: process.env.BRAVE_API_KEY,
    serperApiKey: process.env.SERPER_API_KEY,

    maxSearchQueries: process.env.MAX_SEARCH_QUERIES,
    maxSourcesPerQuery: process.env.MAX_SOURCES_PER_QUERY,
    searchTimeoutMs: process.env.SEARCH_TIMEOUT_MS,
    fetchPageTimeoutMs: process.env.FETCH_PAGE_TIMEOUT_MS,
    rateLimitMaxPerMinute: process.env.RATE_LIMIT_MAX_PER_MINUTE,
    maxContentCharsPerPage: process.env.MAX_CONTENT_CHARS_PER_PAGE,
  });
}

export const config = loadConfig();

