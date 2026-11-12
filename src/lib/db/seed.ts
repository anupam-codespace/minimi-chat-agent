import { getDatabase } from "./index";
import { config } from "../config";
import {
  Conversation,
  Message,
  ResearchSession,
  Source,
  EvidenceSnapshot,
} from "@/types";

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();
  console.log(`Seeding database using adapter: ${db.name}`);

  // Create default user
  await db.upsertUser({
    id: config.defaultUserId,
    email: "user@minimi.ai",
    name: "Research Director",
  });

  // Calculate dates relative to today (current reference: Nov 12, 2026)
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sun, 1 is Mon, 2 is Tue, 4 is Thu

  // Resolve Monday of this week (2026-11-09)
  const diffToMonday = currentDay >= 1 ? currentDay - 1 : 6;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - diffToMonday);
  mondayDate.setHours(10, 30, 0, 0);

  // Resolve 3 November 2026 (or last Tuesday, 9 days ago from Nov 12)
  const nov3Date = new Date(now.getFullYear(), 10, 3, 14, 15, 0, 0); // month is 0-indexed, 10 is Nov

  // Resolve Last Tuesday (either Nov 3 or previous week's Tuesday)
  const lastTuesdayDate = new Date(now);
  const diffToTuesday = (currentDay + 7 - 2) % 7 || 7;
  lastTuesdayDate.setDate(now.getDate() - (diffToTuesday < 7 ? diffToTuesday + 7 : diffToTuesday));
  lastTuesdayDate.setHours(15, 45, 0, 0);

  console.log(`Dates calculated:
  - Reference Now: ${now.toISOString()}
  - Monday Conversation: ${mondayDate.toISOString()}
  - Nov 3 Conversation: ${nov3Date.toISOString()}
  - Last Tuesday Conversation: ${lastTuesdayDate.toISOString()}
  `);

  // ============================================================================
  // CONVERSATION 1: Monday CRM Shortlist (TEST 1)
  // "On Monday we shortlisted 5 CRM tools for a 20-person sales team..."
  // ============================================================================
  const conv1Id = "conv_crm_shortlist_mon";
  await db.createConversation({
    id: conv1Id,
    userId: config.defaultUserId,
    title: "CRM Shortlist for 20-Person Sales Team",
    createdAt: mondayDate.toISOString(),
    updatedAt: mondayDate.toISOString(),
    metadata: {
      tags: ["crm", "sales", "pricing", "shortlist"],
      entityCount: 5,
    },
  });

  const msg1UserId = "msg_crm_mon_user";
  await db.addMessage({
    id: msg1UserId,
    conversationId: conv1Id,
    role: "user",
    content:
      "Shortlist 5 top CRM tools for a 20-person B2B sales team. Compare their pricing tier suitable for 20 seats, core features, and monthly cost.",
    intent: "current_web_research",
    createdAt: mondayDate.toISOString(),
  });

  const msg1AssistantId = "msg_crm_mon_assistant";
  const msg1AssistantDate = new Date(mondayDate.getTime() + 45000).toISOString();

  await db.addMessage({
    id: msg1AssistantId,
    conversationId: conv1Id,
    role: "assistant",
    content: `Here is the shortlist of 5 CRM platforms for your 20-person sales team, based on official pricing and plans evaluated on ${mondayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}:

### 1. HubSpot Sales Hub (Professional)
- **Pricing**: $90/seat/month (billed annually, required 5 seat baseline) -> $1,800/month for 20 seats. Plus a one-time onboarding fee of $1,500.
- **Key Features**: Sequences, workflow automation, custom reporting, 1:1 video messaging, e-signatures.
- **Best for**: Rapid onboarding and seamless marketing alignment.

### 2. Salesforce Sales Cloud (Enterprise Edition)
- **Pricing**: $165/user/month (billed annually) -> $3,300/month for 20 seats. (Alternatively, Pro Suite is $100/user/month with limited workflow limits).
- **Key Features**: Advanced pipeline management, workflow orchestration, Einstein 1 predictive AI features, unlimited custom applications.
- **Best for**: Complex deal stages and deep custom reporting.

### 3. Pipedrive (Professional Tier)
- **Pricing**: $49/user/month (billed annually) -> $980/month for 20 seats.
- **Key Features**: Visual deal pipelines, revenue forecasting, smart docs, e-signatures, contact data enrichment.
- **Best for**: Activity-based sales rep productivity and intuitive UX.

### 4. Zoho CRM (Enterprise Edition)
- **Pricing**: $40/user/month (billed annually) -> $800/month for 20 seats.
- **Key Features**: Zia AI predictive analytics, multi-page layouts, CommandCenter journey orchestrator, portal access.
- **Best for**: Maximum feature density at budget-conscious scale.

### 5. Close CRM (Professional Tier)
- **Pricing**: $99/user/month (billed annually) -> $1,980/month for 20 seats.
- **Key Features**: Built-in multi-channel calling, SMS and email sequences, automated power dialer, pipeline view.
- **Best for**: High-velocity inside sales teams doing outbound calling.`,
    intent: "current_web_research",
    createdAt: msg1AssistantDate,
  });

  const session1Id = "sess_crm_mon";
  await db.createResearchSession({
    id: session1Id,
    conversationId: conv1Id,
    messageId: msg1AssistantId,
    query: "CRM tools shortlist pricing 20 person sales team",
    intent: "current_web_research",
    createdAt: mondayDate.toISOString(),
  });

  const sources1: Source[] = [
    {
      id: "src_crm_hubspot",
      sessionId: session1Id,
      url: "https://www.hubspot.com/pricing/sales",
      domain: "hubspot.com",
      title: "HubSpot Sales Hub Pricing & Plans",
      snippet: "Sales Hub Professional starts at $90 per seat/month with annual commitment.",
      retrievalTimestamp: mondayDate.toISOString(),
      publicationDate: "2026-10-01",
      evidenceQuality: "official",
      confidenceScore: 0.98,
    },
    {
      id: "src_crm_salesforce",
      sessionId: session1Id,
      url: "https://www.salesforce.com/editions-pricing/sales-cloud/",
      domain: "salesforce.com",
      title: "Salesforce Sales Cloud Pricing",
      snippet: "Enterprise edition starts at $165 USD per user/month, billed annually.",
      retrievalTimestamp: mondayDate.toISOString(),
      publicationDate: "2026-10-15",
      evidenceQuality: "official",
      confidenceScore: 0.98,
    },
    {
      id: "src_crm_pipedrive",
      sessionId: session1Id,
      url: "https://www.pipedrive.com/en/pricing",
      domain: "pipedrive.com",
      title: "Pipedrive Pricing - Choose the Best Plan",
      snippet: "Professional plan is $49 per user/month billed annually for advanced forecasting.",
      retrievalTimestamp: mondayDate.toISOString(),
      publicationDate: "2026-09-20",
      evidenceQuality: "official",
      confidenceScore: 0.95,
    },
    {
      id: "src_crm_zoho",
      sessionId: session1Id,
      url: "https://www.zoho.com/crm/zohocrm-pricing.html",
      domain: "zoho.com",
      title: "Zoho CRM Pricing Plans",
      snippet: "Enterprise plan at $40/user/month billed annually.",
      retrievalTimestamp: mondayDate.toISOString(),
      publicationDate: "2026-08-10",
      evidenceQuality: "official",
      confidenceScore: 0.95,
    },
    {
      id: "src_crm_close",
      sessionId: session1Id,
      url: "https://www.close.com/pricing",
      domain: "close.com",
      title: "Close CRM Pricing Plans",
      snippet: "Professional plan at $99 per user/month billed annually.",
      retrievalTimestamp: mondayDate.toISOString(),
      publicationDate: "2026-09-01",
      evidenceQuality: "official",
      confidenceScore: 0.95,
    },
  ];
  await db.addSources(sources1);

  const evidence1: EvidenceSnapshot[] = [
    {
      id: "ev_crm_1",
      conversationId: conv1Id,
      messageId: msg1AssistantId,
      entityName: "HubSpot Sales Hub",
      attributeName: "Professional plan per-seat price",
      extractedValue: "$90/seat/month (billed annually)",
      snapshotDate: mondayDate.toISOString(),
      sourceUrl: "https://www.hubspot.com/pricing/sales",
      sourceId: "src_crm_hubspot",
      evidenceQuality: "official",
      rawQuote: "Sales Hub Professional starts at $90 per seat/month with annual commitment.",
      confidence: 0.98,
    },
    {
      id: "ev_crm_2",
      conversationId: conv1Id,
      messageId: msg1AssistantId,
      entityName: "Salesforce Sales Cloud",
      attributeName: "Enterprise edition per-user price",
      extractedValue: "$165/user/month (billed annually)",
      snapshotDate: mondayDate.toISOString(),
      sourceUrl: "https://www.salesforce.com/editions-pricing/sales-cloud/",
      sourceId: "src_crm_salesforce",
      evidenceQuality: "official",
      rawQuote: "Enterprise edition starts at $165 USD per user/month, billed annually.",
      confidence: 0.98,
    },
    {
      id: "ev_crm_3",
      conversationId: conv1Id,
      messageId: msg1AssistantId,
      entityName: "Pipedrive",
      attributeName: "Professional tier per-user price",
      extractedValue: "$49/user/month (billed annually)",
      snapshotDate: mondayDate.toISOString(),
      sourceUrl: "https://www.pipedrive.com/en/pricing",
      sourceId: "src_crm_pipedrive",
      evidenceQuality: "official",
      rawQuote: "Professional plan is $49 per user/month billed annually.",
      confidence: 0.95,
    },
    {
      id: "ev_crm_4",
      conversationId: conv1Id,
      messageId: msg1AssistantId,
      entityName: "Zoho CRM",
      attributeName: "Enterprise edition per-user price",
      extractedValue: "$40/user/month (billed annually)",
      snapshotDate: mondayDate.toISOString(),
      sourceUrl: "https://www.zoho.com/crm/zohocrm-pricing.html",
      sourceId: "src_crm_zoho",
      evidenceQuality: "official",
      rawQuote: "Enterprise plan at $40/user/month billed annually.",
      confidence: 0.95,
    },
    {
      id: "ev_crm_5",
      conversationId: conv1Id,
      messageId: msg1AssistantId,
      entityName: "Close CRM",
      attributeName: "Professional plan per-user price",
      extractedValue: "$99/user/month (billed annually)",
      snapshotDate: mondayDate.toISOString(),
      sourceUrl: "https://www.close.com/pricing",
      sourceId: "src_crm_close",
      evidenceQuality: "official",
      rawQuote: "Professional plan at $99 per user/month billed annually.",
      confidence: 0.95,
    },
  ];
  await db.addEvidenceSnapshots(evidence1);

  // ============================================================================
  // CONVERSATION 2: 3 November Conversation (TEST 2)
  // "What did I ask you on 3 November? Is your answer still correct today?"
  // ============================================================================
  const conv2Id = "conv_nov3_ai_models";
  await db.createConversation({
    id: conv2Id,
    userId: config.defaultUserId,
    title: "AI Model Pricing and Upgrades (Nov 3)",
    createdAt: nov3Date.toISOString(),
    updatedAt: nov3Date.toISOString(),
    metadata: {
      tags: ["ai-models", "pricing", "tokens", "anthropic", "openai", "gemini"],
      historicalDate: "2026-11-03",
    },
  });

  const msg2UserId = "msg_nov3_user";
  await db.addMessage({
    id: msg2UserId,
    conversationId: conv2Id,
    role: "user",
    content:
      "What is the API pricing for OpenAI GPT-4o mini and Google Gemini 1.5 Flash per million tokens, and did Claude 3.5 Sonnet receive an upgrade recently?",
    intent: "current_web_research",
    createdAt: nov3Date.toISOString(),
  });

  const msg2AssistantId = "msg_nov3_assistant";
  await db.addMessage({
    id: msg2AssistantId,
    conversationId: conv2Id,
    role: "assistant",
    content: `Based on official model pricing and announcements documented as of November 3, 2026:

1. **OpenAI GPT-4o mini**:
   - Input: **$0.15** per 1M tokens
   - Output: **$0.60** per 1M tokens
   - Prompt caching discount: 50% discount on cached input tokens ($0.075 / 1M).

2. **Google Gemini 1.5 Flash**:
   - Input: **$0.075** per 1M tokens (prompts <= 128k)
   - Output: **$0.30** per 1M tokens
   - Context window: 1M token context window.

3. **Anthropic Claude 3.5 Sonnet**:
   - Claude 3.5 Sonnet was upgraded with computer use capabilities in public beta, showing substantial industry improvements on SWE-bench Verified and tool use. Pricing remains $3.00 / 1M input tokens and $15.00 / 1M output tokens.`,
    intent: "current_web_research",
    createdAt: new Date(nov3Date.getTime() + 30000).toISOString(),
  });

  const session2Id = "sess_nov3";
  await db.createResearchSession({
    id: session2Id,
    conversationId: conv2Id,
    messageId: msg2AssistantId,
    query: "GPT-4o mini Gemini 1.5 Flash pricing Claude 3.5 Sonnet upgrade",
    intent: "current_web_research",
    createdAt: nov3Date.toISOString(),
  });

  const sources2: Source[] = [
    {
      id: "src_openai_pricing",
      sessionId: session2Id,
      url: "https://openai.com/api/pricing/",
      domain: "openai.com",
      title: "OpenAI API Pricing",
      snippet: "GPT-4o mini is $0.15 / 1M input tokens and $0.60 / 1M output tokens.",
      retrievalTimestamp: nov3Date.toISOString(),
      publicationDate: "2026-10-20",
      evidenceQuality: "official",
      confidenceScore: 0.99,
    },
    {
      id: "src_google_gemini_pricing",
      sessionId: session2Id,
      url: "https://ai.google.dev/pricing",
      domain: "ai.google.dev",
      title: "Google AI Gemini Developer Pricing",
      snippet: "Gemini 1.5 Flash pricing is $0.075 / 1M input tokens and $0.30 / 1M output tokens.",
      retrievalTimestamp: nov3Date.toISOString(),
      publicationDate: "2026-10-15",
      evidenceQuality: "official",
      confidenceScore: 0.99,
    },
  ];
  await db.addSources(sources2);

  const evidence2: EvidenceSnapshot[] = [
    {
      id: "ev_nov3_gpt4omini_input",
      conversationId: conv2Id,
      messageId: msg2AssistantId,
      entityName: "GPT-4o mini",
      attributeName: "Input Token Pricing per 1M",
      extractedValue: "$0.15 / 1M input tokens",
      snapshotDate: nov3Date.toISOString(),
      sourceUrl: "https://openai.com/api/pricing/",
      sourceId: "src_openai_pricing",
      evidenceQuality: "official",
      rawQuote: "GPT-4o mini is $0.15 / 1M input tokens",
      confidence: 0.99,
    },
    {
      id: "ev_nov3_gemini_input",
      conversationId: conv2Id,
      messageId: msg2AssistantId,
      entityName: "Gemini 1.5 Flash",
      attributeName: "Input Token Pricing per 1M",
      extractedValue: "$0.075 / 1M input tokens",
      snapshotDate: nov3Date.toISOString(),
      sourceUrl: "https://ai.google.dev/pricing",
      sourceId: "src_google_gemini_pricing",
      evidenceQuality: "official",
      rawQuote: "Gemini 1.5 Flash pricing is $0.075 / 1M input tokens",
      confidence: 0.99,
    },
  ];
  await db.addEvidenceSnapshots(evidence2);

  // ============================================================================
  // CONVERSATION 3: Last Tuesday Postgres Hosting (TEST 3)
  // "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
  // ============================================================================
  const conv3Id = "conv_postgres_hosting_tue";
  await db.createConversation({
    id: conv3Id,
    userId: config.defaultUserId,
    title: "Postgres Hosting Comparison",
    createdAt: lastTuesdayDate.toISOString(),
    updatedAt: lastTuesdayDate.toISOString(),
    metadata: {
      tags: ["postgres", "database", "hosting", "supabase", "neon", "aws-rds"],
    },
  });

  const msg3UserId = "msg_pg_tue_user";
  await db.addMessage({
    id: msg3UserId,
    conversationId: conv3Id,
    role: "user",
    content:
      "I need a managed Postgres hosting provider for a 50GB database with 2 vCPUs. Can you compare Supabase, Neon, AWS RDS, and Render on monthly pricing?",
    intent: "current_web_research",
    createdAt: lastTuesdayDate.toISOString(),
  });

  const msg3AssistantId = "msg_pg_tue_assistant";
  await db.addMessage({
    id: msg3AssistantId,
    conversationId: conv3Id,
    role: "assistant",
    content: `Here is the pricing comparison for managed Postgres hosting (50GB storage + ~2 vCPU compute) as of ${lastTuesdayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}:

1. **Supabase**:
   - **Plan**: Pro Plan base ($25/month) + 50GB storage (includes 8GB, remaining 42GB @ $0.125/GB = $5.25) + Small/Medium compute add-on.
   - **Total Estimated Cost**: **$30.25 - $45.00/month**.

2. **Neon**:
   - **Plan**: Scale Tier ($19/month base) + compute units (0.5 - 2 CU autoscaling) + 50GB storage ($0.15/GB beyond included 10GB = $6.00).
   - **Total Estimated Cost**: **$35.00 - $55.00/month** (depending on scale-to-zero idle savings).

3. **AWS RDS (PostgreSQL)**:
   - **Instance**: db.t4g.medium (2 vCPU, 4GB RAM) @ $0.068/hr (~$49/month) + 50GB gp3 storage ($5.75/month).
   - **Total Estimated Cost**: **~$54.75 - $58.00/month**.

4. **Render**:
   - **Plan**: Pro Instance (2 vCPU, 4GB RAM) @ $35/month + 50GB persistent disk ($0.30/GB = $15/month).
   - **Total Estimated Cost**: **$50.00/month**.`,
    intent: "current_web_research",
    createdAt: new Date(lastTuesdayDate.getTime() + 40000).toISOString(),
  });

  const session3Id = "sess_pg_tue";
  await db.createResearchSession({
    id: session3Id,
    conversationId: conv3Id,
    messageId: msg3AssistantId,
    query: "managed postgres hosting 50gb 2 vcpu supabase neon rds render pricing",
    intent: "current_web_research",
    createdAt: lastTuesdayDate.toISOString(),
  });

  const sources3: Source[] = [
    {
      id: "src_pg_supabase",
      sessionId: session3Id,
      url: "https://supabase.com/pricing",
      domain: "supabase.com",
      title: "Supabase Pricing & Billing",
      snippet: "Pro plan starts at $25/month per project with 8GB disk included.",
      retrievalTimestamp: lastTuesdayDate.toISOString(),
      publicationDate: "2026-10-01",
      evidenceQuality: "official",
      confidenceScore: 0.98,
    },
    {
      id: "src_pg_neon",
      sessionId: session3Id,
      url: "https://neon.tech/pricing",
      domain: "neon.tech",
      title: "Neon Serverless Postgres Pricing",
      snippet: "Scale plan at $19/month base + $0.15/GB-month storage.",
      retrievalTimestamp: lastTuesdayDate.toISOString(),
      publicationDate: "2026-10-10",
      evidenceQuality: "official",
      confidenceScore: 0.98,
    },
  ];
  await db.addSources(sources3);

  const evidence3: EvidenceSnapshot[] = [
    {
      id: "ev_pg_supabase",
      conversationId: conv3Id,
      messageId: msg3AssistantId,
      entityName: "Supabase",
      attributeName: "Pro Plan Base Monthly Price",
      extractedValue: "$25/month base",
      snapshotDate: lastTuesdayDate.toISOString(),
      sourceUrl: "https://supabase.com/pricing",
      sourceId: "src_pg_supabase",
      evidenceQuality: "official",
      rawQuote: "Pro plan starts at $25/month per project with 8GB disk included.",
      confidence: 0.98,
    },
    {
      id: "ev_pg_neon",
      conversationId: conv3Id,
      messageId: msg3AssistantId,
      entityName: "Neon",
      attributeName: "Scale Plan Base Monthly Price",
      extractedValue: "$19/month base",
      snapshotDate: lastTuesdayDate.toISOString(),
      sourceUrl: "https://neon.tech/pricing",
      sourceId: "src_pg_neon",
      evidenceQuality: "official",
      rawQuote: "Scale plan at $19/month base + $0.15/GB-month storage.",
      confidence: 0.98,
    },
  ];
  await db.addEvidenceSnapshots(evidence3);

  console.log("Database seeded successfully with historical test conversations!");
}

// If executed directly via CLI
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
