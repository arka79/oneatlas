/**
 * SEED DATA — ILLUSTRATIVE, NOT LIVE.
 *
 * This file gives the app a varied catalog to develop against. Model names
 * reflect publicly announced families, but every price, context window,
 * benchmark score, and launch date below is a hand-entered approximation for
 * demonstration. Nothing here was scraped from a vendor, verified against a
 * leaderboard, or checked with a human. It is not suitable for procurement,
 * budgeting, or research claims.
 *
 * The seed script writes `verificationStatus: "ILLUSTRATIVE"`, an explanatory
 * `dataSource`, `sourceUrl: null`, and the revision date to every record. The
 * UI labels these records as illustrative. Replace this file with a real
 * ingestion pipeline (and set `verificationStatus` honestly) before presenting
 * any of these numbers as fact.
 */

export const SEED_META = {
  label: "Illustrative seeded dataset",
  revisionDate: "2026-11-01",
  verificationStatus: "ILLUSTRATIVE",
  dataSource:
    "Illustrative seed dataset — hand-entered approximations; not vendor pricing or published benchmark results.",
  note: "Approximate figures entered by hand for a demo catalog. Not live vendor data.",
} as const;

export type SeedModality = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "CODE";
export type SeedModelType =
  | "GENERAL"
  | "REASONING"
  | "CODING"
  | "MULTIMODAL"
  | "EMBEDDING";

export type SeedBenchmarkSlug =
  | "mmlu"
  | "gpqa-diamond"
  | "swe-bench-verified"
  | "aime-2025"
  | "mmmu"
  | "humaneval"
  | "ifeval";

export type SeedLab = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  country: string;
  foundedYear: number;
};

export type SeedProvider = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  regions: string[];
};

export type SeedCapability = {
  slug: string;
  name: string;
  description: string;
  category: string;
};

export type SeedModel = {
  slug: string;
  name: string;
  description: string;
  labSlug: string;
  modelType: SeedModelType;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number | null;
  /** USD per 1,000,000 input tokens. */
  inputPricePerMTokUsd: number;
  /** USD per 1,000,000 output tokens. */
  outputPricePerMTokUsd: number;
  modalities: SeedModality[];
  isOpenWeights: boolean;
  license: string;
  knowledgeCutoff: string | null;
  providerSlugs: string[];
  capabilitySlugs: string[];
  /** Optional provider-specific price override, in the same USD/1M units. */
  providerPricing?: Record<
    string,
    { inputPricePerMTokUsd: number; outputPricePerMTokUsd: number }
  >;
  /** Partial benchmark coverage is intentional; not every model runs every eval. */
  scores?: Partial<Record<SeedBenchmarkSlug, number>>;
};

export type SeedBenchmark = {
  slug: SeedBenchmarkSlug;
  name: string;
  description: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  version: string;
};

// Capabilities describe product features, not input modalities (those live on
// Model.modalities). Keeping them in their own table avoids free-text drift.
export const capabilities: SeedCapability[] = [
  {
    slug: "streaming",
    name: "Streaming",
    description: "Incremental token output instead of a single buffered response.",
    category: "Output",
  },
  {
    slug: "tool-use",
    name: "Tool use",
    description: "Function/tool calling with structured arguments.",
    category: "Tooling",
  },
  {
    slug: "structured-output",
    name: "Structured output",
    description: "Responses constrained to a supplied JSON schema.",
    category: "Output",
  },
  {
    slug: "prompt-caching",
    name: "Prompt caching",
    description: "Reuse stable prompt prefixes at a reduced rate.",
    category: "Cost control",
  },
  {
    slug: "fine-tuning",
    name: "Fine-tuning",
    description: "Provider-hosted adaptation of model weights on custom data.",
    category: "Customisation",
  },
  {
    slug: "extended-thinking",
    name: "Extended thinking",
    description: "A budgeted reasoning phase before the final answer.",
    category: "Reasoning",
  },
  {
    slug: "code-execution",
    name: "Code execution",
    description: "Run generated code in a sandboxed tool loop.",
    category: "Tooling",
  },
  {
    slug: "multilingual",
    name: "Multilingual",
    description: "Explicitly tuned for non-English inputs and outputs.",
    category: "Language",
  },
  {
    slug: "batch-inference",
    name: "Batch inference",
    description: "Asynchronous bulk requests, usually at a discounted rate.",
    category: "Operations",
  },
];

const CORE_CHAT = ["streaming", "tool-use", "structured-output", "multilingual"];
const OPEN_MODEL = [...CORE_CHAT, "fine-tuning"];
const REASONING = [...CORE_CHAT, "extended-thinking"];

export const labs: SeedLab[] = [
  {
    slug: "openai",
    name: "OpenAI",
    description:
      "Research and deployment company behind the GPT series and the ChatGPT product. Ships closed-weight models through its own API and Azure.",
    websiteUrl: "https://openai.com",
    country: "United States",
    foundedYear: 2015,
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    description:
      "AI safety company building the Claude family, with a focus on long-context reasoning, tool use, and agentic coding.",
    websiteUrl: "https://www.anthropic.com",
    country: "United States",
    foundedYear: 2021,
  },
  {
    slug: "google-deepmind",
    name: "Google DeepMind",
    description:
      "Google's combined AI research unit, responsible for the Gemini and Gemma families and much of the underlying research.",
    websiteUrl: "https://deepmind.google",
    country: "United Kingdom",
    foundedYear: 2010,
  },
  {
    slug: "meta-ai",
    name: "Meta AI",
    description:
      "Meta's AI research organisation, publisher of the open-weight Llama family and the FAIR research lab.",
    websiteUrl: "https://ai.meta.com",
    country: "United States",
    foundedYear: 2013,
  },
  {
    slug: "mistral-ai",
    name: "Mistral AI",
    description:
      "Paris-based lab building efficient open and commercial models, with a strong European enterprise focus.",
    websiteUrl: "https://mistral.ai",
    country: "France",
    foundedYear: 2023,
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    description:
      "Chinese research lab publishing open-weight reasoning and general-purpose models alongside its own API.",
    websiteUrl: "https://www.deepseek.com",
    country: "China",
    foundedYear: 2023,
  },
  {
    slug: "alibaba-qwen",
    name: "Alibaba Qwen",
    description:
      "Alibaba's model team, releasing the broadly used open-weight Qwen family in a wide range of sizes.",
    websiteUrl: "https://qwen.ai",
    country: "China",
    foundedYear: 2023,
  },
  {
    slug: "xai",
    name: "xAI",
    description:
      "Elon Musk's AI company, building the Grok models and integrating them with the X platform.",
    websiteUrl: "https://x.ai",
    country: "United States",
    foundedYear: 2023,
  },
  {
    slug: "cohere",
    name: "Cohere",
    description:
      "Enterprise-focused AI company building the Command generation models and Embed/rerank retrieval models.",
    websiteUrl: "https://cohere.com",
    country: "Canada",
    foundedYear: 2019,
  },
  {
    slug: "ai21-labs",
    name: "AI21 Labs",
    description:
      "Israeli lab known for the Jamba hybrid state-space/transformer architecture and enterprise writing tools.",
    websiteUrl: "https://www.ai21.com",
    country: "Israel",
    foundedYear: 2017,
  },
  {
    slug: "microsoft-ai",
    name: "Microsoft AI",
    description:
      "Microsoft's model research group, publisher of the small, openly licensed Phi family.",
    websiteUrl: "https://www.microsoft.com/en-us/research/group/ai-frontiers",
    country: "United States",
    foundedYear: 2023,
  },
  {
    slug: "nvidia",
    name: "NVIDIA",
    description:
      "GPU and AI systems company that also publishes open Nemotron models tuned for efficient serving.",
    websiteUrl: "https://www.nvidia.com/en-us/ai",
    country: "United States",
    foundedYear: 1993,
  },
];

export const providers: SeedProvider[] = [
  {
    slug: "openai-api",
    name: "OpenAI API",
    description:
      "First-party API for OpenAI models, with managed tooling, fine-tuning, and batch endpoints.",
    websiteUrl: "https://platform.openai.com",
    regions: ["Global"],
  },
  {
    slug: "anthropic-api",
    name: "Anthropic API",
    description:
      "First-party API for Claude models, including prompt caching and extended thinking controls.",
    websiteUrl: "https://www.anthropic.com/api",
    regions: ["Global"],
  },
  {
    slug: "google-vertex",
    name: "Google Vertex AI",
    description:
      "Google Cloud's managed AI platform, serving Gemini and selected third-party models with enterprise IAM.",
    websiteUrl: "https://cloud.google.com/vertex-ai",
    regions: ["Global", "EU", "US"],
  },
  {
    slug: "amazon-bedrock",
    name: "Amazon Bedrock",
    description:
      "AWS's managed model marketplace, offering models from multiple labs behind a single AWS API.",
    websiteUrl: "https://aws.amazon.com/bedrock",
    regions: ["US", "EU", "APAC"],
  },
  {
    slug: "azure-openai",
    name: "Azure OpenAI",
    description:
      "Microsoft's managed deployment of OpenAI models, integrated with Azure identity and networking.",
    websiteUrl: "https://azure.microsoft.com/products/ai-services/openai-service",
    regions: ["US", "EU", "APAC"],
  },
  {
    slug: "together-ai",
    name: "Together AI",
    description:
      "Inference platform specialising in open-weight models, with serverless and dedicated endpoints.",
    websiteUrl: "https://www.together.ai",
    regions: ["US", "EU"],
  },
  {
    slug: "groq",
    name: "Groq",
    description:
      "Low-latency inference provider running open-weight models on its own accelerator hardware.",
    websiteUrl: "https://groq.com",
    regions: ["US"],
  },
  {
    slug: "openrouter",
    name: "OpenRouter",
    description:
      "Aggregator that routes requests across many providers, useful for fallbacks and price comparison.",
    websiteUrl: "https://openrouter.ai",
    regions: ["Global"],
  },
  {
    slug: "fireworks-ai",
    name: "Fireworks AI",
    description:
      "Inference platform for open-weight models with fast serverless endpoints and fine-tuning services.",
    websiteUrl: "https://fireworks.ai",
    regions: ["US", "EU"],
  },
  {
    slug: "mistral-platform",
    name: "Mistral AI La Plateforme",
    description:
      "Mistral's first-party API, including European data residency options for enterprise customers.",
    websiteUrl: "https://console.mistral.ai",
    regions: ["Global", "EU"],
  },
  {
    slug: "xai-api",
    name: "xAI API",
    description:
      "First-party API for Grok models, with OpenAI-compatible endpoints and tool calling.",
    websiteUrl: "https://x.ai/api",
    regions: ["Global", "US"],
  },
  {
    slug: "cohere-api",
    name: "Cohere API",
    description:
      "First-party API for Command and Embed models, with enterprise deployment options.",
    websiteUrl: "https://cohere.com",
    regions: ["Global", "US", "EU"],
  },
];

export const benchmarks: SeedBenchmark[] = [
  {
    slug: "mmlu",
    name: "MMLU",
    description:
      "Multiple-choice questions across 57 academic subjects, measuring broad knowledge rather than task performance.",
    category: "Knowledge",
    unit: "%",
    higherIsBetter: true,
    version: "v1",
  },
  {
    slug: "gpqa-diamond",
    name: "GPQA Diamond",
    description:
      "Graduate-level physics, chemistry, and biology questions written to resist simple web lookup.",
    category: "Science reasoning",
    unit: "%",
    higherIsBetter: true,
    version: "diamond",
  },
  {
    slug: "swe-bench-verified",
    name: "SWE-bench Verified",
    description:
      "Resolving real GitHub issues in Python repositories, a proxy for agentic software engineering ability.",
    category: "Coding",
    unit: "%",
    higherIsBetter: true,
    version: "verified",
  },
  {
    slug: "aime-2025",
    name: "AIME 2025",
    description:
      "Competition mathematics problems from the 2025 American Invitational Mathematics Examination.",
    category: "Mathematics",
    unit: "%",
    higherIsBetter: true,
    version: "2025",
  },
  {
    slug: "mmmu",
    name: "MMMU",
    description:
      "College-level multimodal questions combining images, charts, and text.",
    category: "Multimodal",
    unit: "%",
    higherIsBetter: true,
    version: "v1",
  },
  {
    slug: "humaneval",
    name: "HumanEval",
    description:
      "Synthesising short Python functions from docstrings, a narrow but widely reported coding eval.",
    category: "Coding",
    unit: "%",
    higherIsBetter: true,
    version: "v1",
  },
  {
    slug: "ifeval",
    name: "IFEval",
    description:
      "Instruction-following checks with verifiable formatting constraints.",
    category: "Instruction following",
    unit: "%",
    higherIsBetter: true,
    version: "v1",
  },
];

/**
 * 50 models across 12 labs. Prices are USD per 1M tokens, not per request.
 * Every score below is an illustrative placeholder, not a published result.
 */
export const models: SeedModel[] = [
  // ---------------------------------------------------------------- OpenAI
  {
    slug: "gpt-5",
    name: "GPT-5",
    description:
      "OpenAI's flagship general-purpose model for reasoning, coding, and long-form writing, available through the OpenAI API and Azure.",
    labSlug: "openai",
    modelType: "GENERAL",
    releaseDate: "2025-08-07",
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    inputPricePerMTokUsd: 1.25,
    outputPricePerMTokUsd: 10,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-09",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...REASONING, "prompt-caching", "code-execution"],
    scores: {
      mmlu: 89.4,
      "gpqa-diamond": 85.7,
      "swe-bench-verified": 74.9,
      "aime-2025": 94.6,
      mmmu: 84.2,
      ifeval: 92.1,
    },
  },
  {
    slug: "gpt-5-mini",
    name: "GPT-5 mini",
    description:
      "A cheaper, faster sibling of GPT-5 for high-volume workloads where latency and cost matter more than peak accuracy.",
    labSlug: "openai",
    modelType: "GENERAL",
    releaseDate: "2025-08-07",
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    inputPricePerMTokUsd: 0.25,
    outputPricePerMTokUsd: 2,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-09",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...REASONING, "prompt-caching"],
    scores: {
      mmlu: 85.2,
      "gpqa-diamond": 77.4,
      "swe-bench-verified": 61.3,
      "aime-2025": 86.7,
      mmmu: 76.1,
      ifeval: 88.4,
    },
  },
  {
    slug: "gpt-5-nano",
    name: "GPT-5 nano",
    description:
      "The smallest GPT-5 tier, intended for classification, extraction, and other high-throughput tasks.",
    labSlug: "openai",
    modelType: "GENERAL",
    releaseDate: "2025-08-07",
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    inputPricePerMTokUsd: 0.05,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-09",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 78.6,
      "gpqa-diamond": 65.2,
      "swe-bench-verified": 42.8,
      "aime-2025": 73.1,
      mmmu: 64.0,
      ifeval: 82.5,
    },
  },
  {
    slug: "gpt-4-1",
    name: "GPT-4.1",
    description:
      "A long-context GPT-4 generation focused on instruction following and front-end coding, with a 1M-token window.",
    labSlug: "openai",
    modelType: "GENERAL",
    releaseDate: "2025-04-14",
    contextWindow: 1_047_576,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 2,
    outputPricePerMTokUsd: 8,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching", "fine-tuning"],
    scores: {
      mmlu: 88.7,
      "gpqa-diamond": 81.2,
      "swe-bench-verified": 68.4,
      "aime-2025": 87.5,
      mmmu: 80.1,
      ifeval: 90.3,
    },
  },
  {
    slug: "gpt-4-1-mini",
    name: "GPT-4.1 mini",
    description:
      "The compact GPT-4.1 variant, positioned for cost-sensitive extraction and agent steps.",
    labSlug: "openai",
    modelType: "GENERAL",
    releaseDate: "2025-04-14",
    contextWindow: 1_047_576,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.4,
    outputPricePerMTokUsd: 1.6,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 83.4,
      "gpqa-diamond": 72.1,
      "swe-bench-verified": 52.6,
      "aime-2025": 79.8,
      mmmu: 71.5,
      ifeval: 86.2,
    },
  },
  {
    slug: "gpt-4o",
    name: "GPT-4o",
    description:
      "A natively multimodal GPT-4 generation that accepts text, image, and audio input and remains a common production baseline.",
    labSlug: "openai",
    modelType: "MULTIMODAL",
    releaseDate: "2024-05-13",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    inputPricePerMTokUsd: 2.5,
    outputPricePerMTokUsd: 10,
    modalities: ["TEXT", "IMAGE", "AUDIO", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2023-10",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching", "fine-tuning"],
    scores: {
      mmlu: 85.7,
      "gpqa-diamond": 66.3,
      "swe-bench-verified": 38.9,
      "aime-2025": 70.2,
      mmmu: 69.8,
      ifeval: 84.1,
    },
  },
  {
    slug: "o3",
    name: "o3",
    description:
      "OpenAI's reasoning model for multi-step science, mathematics, and agentic coding with a sizable thinking budget.",
    labSlug: "openai",
    modelType: "REASONING",
    releaseDate: "2025-04-16",
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    inputPricePerMTokUsd: 2,
    outputPricePerMTokUsd: 8,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...REASONING, "code-execution"],
    scores: {
      mmlu: 89.1,
      "gpqa-diamond": 83.3,
      "swe-bench-verified": 69.1,
      "aime-2025": 91.6,
      mmmu: 81.4,
      ifeval: 88.9,
    },
  },
  {
    slug: "o4-mini",
    name: "o4-mini",
    description:
      "A cost-efficient reasoning model that still supports tool use and code execution for agent workflows.",
    labSlug: "openai",
    modelType: "REASONING",
    releaseDate: "2025-04-16",
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    inputPricePerMTokUsd: 1.1,
    outputPricePerMTokUsd: 4.4,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: [...REASONING, "code-execution"],
    scores: {
      mmlu: 84.9,
      "gpqa-diamond": 75.8,
      "swe-bench-verified": 58.2,
      "aime-2025": 87.3,
      mmmu: 74.6,
      ifeval: 85.7,
    },
  },
  {
    slug: "text-embedding-3-large",
    name: "text-embedding-3-large",
    description:
      "OpenAI's large text embedding model for semantic search and retrieval, priced per input token only.",
    labSlug: "openai",
    modelType: "EMBEDDING",
    releaseDate: "2024-01-25",
    contextWindow: 8_191,
    maxOutputTokens: null,
    inputPricePerMTokUsd: 0.13,
    outputPricePerMTokUsd: 0,
    modalities: ["TEXT"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: null,
    providerSlugs: ["openai-api", "azure-openai"],
    capabilitySlugs: ["batch-inference", "multilingual"],
  },

  // ------------------------------------------------------------- Anthropic
  {
    slug: "claude-opus-4-1",
    name: "Claude Opus 4.1",
    description:
      "Anthropic's most capable Claude tier for complex agentic coding and research tasks, served with extended thinking.",
    labSlug: "anthropic",
    modelType: "REASONING",
    releaseDate: "2025-08-05",
    contextWindow: 200_000,
    maxOutputTokens: 32_000,
    inputPricePerMTokUsd: 15,
    outputPricePerMTokUsd: 75,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-03",
    providerSlugs: ["anthropic-api", "amazon-bedrock", "google-vertex"],
    capabilitySlugs: [...REASONING, "prompt-caching", "code-execution"],
    providerPricing: {
      "amazon-bedrock": { inputPricePerMTokUsd: 16.5, outputPricePerMTokUsd: 82.5 },
    },
    scores: {
      mmlu: 90.1,
      "gpqa-diamond": 80.9,
      "swe-bench-verified": 74.5,
      "aime-2025": 93.9,
      mmmu: 81.0,
      ifeval: 91.8,
    },
  },
  {
    slug: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description:
      "The balanced Claude tier: strong coding and tool use at a mid-range price, the usual default for production agents.",
    labSlug: "anthropic",
    modelType: "GENERAL",
    releaseDate: "2025-05-22",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    inputPricePerMTokUsd: 3,
    outputPricePerMTokUsd: 15,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-03",
    providerSlugs: ["anthropic-api", "amazon-bedrock", "google-vertex"],
    capabilitySlugs: [...REASONING, "prompt-caching", "code-execution"],
    scores: {
      mmlu: 88.6,
      "gpqa-diamond": 75.4,
      "swe-bench-verified": 72.7,
      "aime-2025": 92.3,
      mmmu: 79.4,
      ifeval: 90.6,
    },
  },
  {
    slug: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    description:
      "The first Claude model with a user-visible extended thinking mode, aimed at multi-step coding and analysis.",
    labSlug: "anthropic",
    modelType: "REASONING",
    releaseDate: "2025-02-24",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    inputPricePerMTokUsd: 3,
    outputPricePerMTokUsd: 15,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-11",
    providerSlugs: ["anthropic-api", "amazon-bedrock", "google-vertex"],
    capabilitySlugs: [...REASONING, "prompt-caching"],
    scores: {
      mmlu: 86.9,
      "gpqa-diamond": 70.6,
      "swe-bench-verified": 62.3,
      "aime-2025": 84.5,
      mmmu: 76.2,
      ifeval: 87.9,
    },
  },
  {
    slug: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    description:
      "A fast, inexpensive Claude model for routing, extraction, and customer-facing chat where latency dominates.",
    labSlug: "anthropic",
    modelType: "GENERAL",
    releaseDate: "2024-11-04",
    contextWindow: 200_000,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.8,
    outputPricePerMTokUsd: 4,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-07",
    providerSlugs: ["anthropic-api", "amazon-bedrock", "google-vertex"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 79.8,
      "gpqa-diamond": 52.6,
      "swe-bench-verified": 40.1,
      "aime-2025": 60.4,
      ifeval: 81.5,
    },
  },
  {
    slug: "claude-3-opus",
    name: "Claude 3 Opus",
    description:
      "An older flagship Claude model retained for compatibility and long-form editorial work.",
    labSlug: "anthropic",
    modelType: "GENERAL",
    releaseDate: "2024-03-04",
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 15,
    outputPricePerMTokUsd: 75,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2023-08",
    providerSlugs: ["anthropic-api", "amazon-bedrock", "google-vertex"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 86.4,
      "gpqa-diamond": 50.4,
      "swe-bench-verified": 28.1,
      "aime-2025": 52.2,
      mmmu: 63.9,
      ifeval: 82.7,
    },
  },

  // -------------------------------------------------------- Google DeepMind
  {
    slug: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Google's long-context multimodal model with native audio and video input, exposed through Vertex AI and the Gemini API.",
    labSlug: "google-deepmind",
    modelType: "MULTIMODAL",
    releaseDate: "2025-06-17",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    inputPricePerMTokUsd: 1.25,
    outputPricePerMTokUsd: 10,
    modalities: ["TEXT", "IMAGE", "AUDIO", "VIDEO", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-01",
    providerSlugs: ["google-vertex", "openrouter"],
    capabilitySlugs: [...REASONING, "prompt-caching", "code-execution"],
    scores: {
      mmlu: 89.8,
      "gpqa-diamond": 84.0,
      "swe-bench-verified": 63.8,
      "aime-2025": 92.0,
      mmmu: 82.0,
      ifeval: 90.2,
    },
  },
  {
    slug: "gemini-2-5-flash",
    name: "Gemini 2.5 Flash",
    description:
      "A cost-optimised multimodal Gemini variant for high-throughput summarisation, extraction, and classification.",
    labSlug: "google-deepmind",
    modelType: "MULTIMODAL",
    releaseDate: "2025-06-17",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    inputPricePerMTokUsd: 0.3,
    outputPricePerMTokUsd: 2.5,
    modalities: ["TEXT", "IMAGE", "AUDIO", "VIDEO", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-01",
    providerSlugs: ["google-vertex", "openrouter"],
    capabilitySlugs: [...REASONING, "prompt-caching"],
    scores: {
      mmlu: 84.7,
      "gpqa-diamond": 78.3,
      "swe-bench-verified": 52.1,
      "aime-2025": 88.0,
      mmmu: 74.5,
      ifeval: 86.4,
    },
  },
  {
    slug: "gemini-2-5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description:
      "The cheapest Gemini 2.5 tier, tuned for high-volume classification and lightweight multimodal extraction.",
    labSlug: "google-deepmind",
    modelType: "MULTIMODAL",
    releaseDate: "2025-07-22",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    inputPricePerMTokUsd: 0.1,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "IMAGE", "AUDIO", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-01",
    providerSlugs: ["google-vertex"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 79.4,
      "gpqa-diamond": 70.1,
      "swe-bench-verified": 40.5,
      "aime-2025": 78.6,
      mmmu: 68.2,
      ifeval: 80.9,
    },
  },
  {
    slug: "gemini-2-0-flash",
    name: "Gemini 2.0 Flash",
    description:
      "An earlier multimodal Gemini generation still used for low-cost document processing and agent loops.",
    labSlug: "google-deepmind",
    modelType: "MULTIMODAL",
    releaseDate: "2025-02-05",
    contextWindow: 1_048_576,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.1,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "IMAGE", "AUDIO", "VIDEO", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["google-vertex", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 81.6,
      "gpqa-diamond": 60.2,
      "swe-bench-verified": 31.4,
      "aime-2025": 72.8,
      mmmu: 70.5,
      ifeval: 83.1,
    },
  },
  {
    slug: "gemini-2-0-flash-lite",
    name: "Gemini 2.0 Flash-Lite",
    description:
      "A budget Gemini 2.0 variant for simple text and image tasks at the lowest per-token cost in the family.",
    labSlug: "google-deepmind",
    modelType: "MULTIMODAL",
    releaseDate: "2025-02-05",
    contextWindow: 1_048_576,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.075,
    outputPricePerMTokUsd: 0.3,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["google-vertex"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 76.3,
      "gpqa-diamond": 51.8,
      "swe-bench-verified": 24.6,
      "aime-2025": 60.1,
      mmmu: 63.7,
      ifeval: 78.8,
    },
  },
  {
    slug: "gemma-3-27b",
    name: "Gemma 3 27B",
    description:
      "Google's mid-sized open-weight Gemma model with image input and a 128K context, designed for single-GPU serving.",
    labSlug: "google-deepmind",
    modelType: "GENERAL",
    releaseDate: "2025-03-12",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.1,
    outputPricePerMTokUsd: 0.2,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: true,
    license: "Gemma Terms of Use",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["google-vertex", "together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 78.1,
      "gpqa-diamond": 48.6,
      "swe-bench-verified": 20.3,
      "aime-2025": 56.7,
      mmmu: 60.2,
      ifeval: 75.4,
    },
  },

  // ---------------------------------------------------------------- Meta AI
  {
    slug: "llama-4-maverick",
    name: "Llama 4 Maverick",
    description:
      "Meta's mixture-of-experts open-weight model, widely hosted by third-party inference platforms at competitive prices.",
    labSlug: "meta-ai",
    modelType: "MULTIMODAL",
    releaseDate: "2025-04-05",
    contextWindow: 1_048_576,
    maxOutputTokens: 16_384,
    inputPricePerMTokUsd: 0.27,
    outputPricePerMTokUsd: 0.85,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: true,
    license: "Llama 4 Community License",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["amazon-bedrock", "together-ai", "groq", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    providerPricing: {
      groq: { inputPricePerMTokUsd: 0.2, outputPricePerMTokUsd: 0.6 },
    },
    scores: {
      mmlu: 85.5,
      "gpqa-diamond": 69.8,
      "swe-bench-verified": 38.4,
      "aime-2025": 70.0,
      mmmu: 73.4,
      ifeval: 84.7,
    },
  },
  {
    slug: "llama-4-scout",
    name: "Llama 4 Scout",
    description:
      "The smaller Llama 4 variant, notable for a very large context window and low per-token cost on open hosting platforms.",
    labSlug: "meta-ai",
    modelType: "MULTIMODAL",
    releaseDate: "2025-04-05",
    contextWindow: 10_000_000,
    maxOutputTokens: 16_384,
    inputPricePerMTokUsd: 0.11,
    outputPricePerMTokUsd: 0.34,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: true,
    license: "Llama 4 Community License",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["amazon-bedrock", "together-ai", "groq", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 82.1,
      "gpqa-diamond": 61.4,
      "swe-bench-verified": 29.7,
      "aime-2025": 63.2,
      mmmu: 66.9,
      ifeval: 79.6,
    },
  },
  {
    slug: "llama-3-3-70b",
    name: "Llama 3.3 70B",
    description:
      "A text-only open-weight workhorse with broad provider support and a familiar instruction-tuning profile.",
    labSlug: "meta-ai",
    modelType: "GENERAL",
    releaseDate: "2024-12-06",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.23,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Llama 3.3 Community License",
    knowledgeCutoff: "2023-12",
    providerSlugs: ["amazon-bedrock", "together-ai", "groq", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 80.4,
      "gpqa-diamond": 50.9,
      "swe-bench-verified": 22.8,
      "aime-2025": 55.1,
      ifeval: 78.2,
    },
  },
  {
    slug: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    description:
      "Meta's largest dense Llama release, expensive to serve but useful as a quality ceiling for open-weight deployments.",
    labSlug: "meta-ai",
    modelType: "GENERAL",
    releaseDate: "2024-07-23",
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 0.9,
    outputPricePerMTokUsd: 0.9,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Llama 3.1 Community License",
    knowledgeCutoff: "2023-12",
    providerSlugs: ["amazon-bedrock", "together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 79.6,
      "gpqa-diamond": 49.2,
      "swe-bench-verified": 24.1,
      "aime-2025": 53.4,
      ifeval: 77.5,
    },
  },
  {
    slug: "llama-guard-3-8b",
    name: "Llama Guard 3 8B",
    description:
      "A small open-weight safety classifier that labels prompts and responses against a configurable policy taxonomy.",
    labSlug: "meta-ai",
    modelType: "GENERAL",
    releaseDate: "2024-04-18",
    contextWindow: 131_072,
    maxOutputTokens: 1_024,
    inputPricePerMTokUsd: 0.05,
    outputPricePerMTokUsd: 0.05,
    modalities: ["TEXT"],
    isOpenWeights: true,
    license: "Llama 3 Community License",
    knowledgeCutoff: "2023-12",
    providerSlugs: ["amazon-bedrock", "together-ai", "openrouter"],
    capabilitySlugs: ["streaming", "fine-tuning", "multilingual"],
  },

  // --------------------------------------------------------------- Mistral
  {
    slug: "mistral-medium-3",
    name: "Mistral Medium 3",
    description:
      "Mistral's mid-sized commercial model positioned for enterprise assistants, with multimodal input and European hosting options.",
    labSlug: "mistral-ai",
    modelType: "GENERAL",
    releaseDate: "2025-05-07",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.4,
    outputPricePerMTokUsd: 2,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-01",
    providerSlugs: ["mistral-platform", "amazon-bedrock", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching", "fine-tuning"],
    providerPricing: {
      "amazon-bedrock": { inputPricePerMTokUsd: 0.45, outputPricePerMTokUsd: 2.2 },
    },
    scores: {
      mmlu: 82.8,
      "gpqa-diamond": 64.2,
      "swe-bench-verified": 42.6,
      "aime-2025": 71.5,
      mmmu: 67.3,
      ifeval: 84.2,
    },
  },
  {
    slug: "mistral-small-3-1",
    name: "Mistral Small 3.1",
    description:
      "A 24B open-weight model with image input and low serving cost, intended for local and edge deployments.",
    labSlug: "mistral-ai",
    modelType: "GENERAL",
    releaseDate: "2025-03-17",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.1,
    outputPricePerMTokUsd: 0.3,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: true,
    license: "Apache 2.0",
    knowledgeCutoff: "2024-10",
    providerSlugs: ["mistral-platform", "together-ai", "openrouter", "fireworks-ai"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 78.9,
      "gpqa-diamond": 55.7,
      "swe-bench-verified": 31.2,
      "aime-2025": 62.4,
      mmmu: 61.8,
      ifeval: 80.5,
    },
  },
  {
    slug: "codestral-25-01",
    name: "Codestral 25.01",
    description:
      "A code-specialised Mistral model with fill-in-the-middle support for IDE completion and repository-aware editing.",
    labSlug: "mistral-ai",
    modelType: "CODING",
    releaseDate: "2025-01-13",
    contextWindow: 262_144,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.3,
    outputPricePerMTokUsd: 0.9,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Mistral AI Non-Production License",
    knowledgeCutoff: "2024-10",
    providerSlugs: ["mistral-platform", "together-ai", "openrouter", "fireworks-ai"],
    capabilitySlugs: ["streaming", "tool-use", "structured-output", "fine-tuning"],
    scores: {
      mmlu: 72.4,
      "swe-bench-verified": 28.7,
      humaneval: 86.2,
      ifeval: 73.6,
    },
  },
  {
    slug: "mistral-embed",
    name: "mistral-embed",
    description:
      "Mistral's text embedding endpoint for retrieval-augmented generation, billed on input tokens only.",
    labSlug: "mistral-ai",
    modelType: "EMBEDDING",
    releaseDate: "2023-12-11",
    contextWindow: 8_192,
    maxOutputTokens: null,
    inputPricePerMTokUsd: 0.1,
    outputPricePerMTokUsd: 0,
    modalities: ["TEXT"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: null,
    providerSlugs: ["mistral-platform"],
    capabilitySlugs: ["batch-inference", "multilingual"],
  },

  // --------------------------------------------------------------- DeepSeek
  {
    slug: "deepseek-v3-1",
    name: "DeepSeek V3.1",
    description:
      "An open-weight mixture-of-experts model from DeepSeek offering strong general performance at open-model prices.",
    labSlug: "deepseek",
    modelType: "GENERAL",
    releaseDate: "2025-08-21",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.27,
    outputPricePerMTokUsd: 1.1,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "MIT",
    knowledgeCutoff: "2025-02",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter", "amazon-bedrock"],
    capabilitySlugs: [...CORE_CHAT, "fine-tuning", "prompt-caching"],
    providerPricing: {
      "together-ai": { inputPricePerMTokUsd: 0.3, outputPricePerMTokUsd: 1.2 },
    },
    scores: {
      mmlu: 88.4,
      "gpqa-diamond": 78.1,
      "swe-bench-verified": 66.0,
      "aime-2025": 89.1,
      ifeval: 88.7,
    },
  },
  {
    slug: "deepseek-r1",
    name: "DeepSeek R1",
    description:
      "An open-weight reasoning model that exposes its chain of thought, popular for cheap math and logic experimentation.",
    labSlug: "deepseek",
    modelType: "REASONING",
    releaseDate: "2025-01-20",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.55,
    outputPricePerMTokUsd: 2.19,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "MIT",
    knowledgeCutoff: "2024-07",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter", "amazon-bedrock"],
    capabilitySlugs: [...REASONING, "fine-tuning"],
    scores: {
      mmlu: 87.6,
      "gpqa-diamond": 75.2,
      "swe-bench-verified": 49.2,
      "aime-2025": 91.4,
      ifeval: 82.8,
    },
  },
  {
    slug: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    description:
      "A Llama 3.3 70B student distilled from R1 reasoning traces, offering cheaper reasoning than the full model.",
    labSlug: "deepseek",
    modelType: "REASONING",
    releaseDate: "2025-01-20",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.23,
    outputPricePerMTokUsd: 0.69,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "MIT",
    knowledgeCutoff: "2024-07",
    providerSlugs: ["together-ai", "groq", "fireworks-ai", "openrouter"],
    capabilitySlugs: [...REASONING, "fine-tuning"],
    scores: {
      mmlu: 82.3,
      "gpqa-diamond": 64.7,
      "swe-bench-verified": 31.8,
      "aime-2025": 78.2,
      ifeval: 77.9,
    },
  },
  {
    slug: "deepseek-v2-5",
    name: "DeepSeek V2.5",
    description:
      "A previous-generation DeepSeek mixture-of-experts model, kept in the catalog as a low-cost text baseline.",
    labSlug: "deepseek",
    modelType: "GENERAL",
    releaseDate: "2024-09-05",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.14,
    outputPricePerMTokUsd: 0.28,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "DeepSeek Model License",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["together-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 84.1,
      "gpqa-diamond": 62.9,
      "swe-bench-verified": 24.6,
      "aime-2025": 65.8,
      ifeval: 80.1,
    },
  },

  // ------------------------------------------------------------------ Qwen
  {
    slug: "qwen3-235b-a22b",
    name: "Qwen3 235B A22B",
    description:
      "Alibaba's large open-weight mixture-of-experts model with switchable thinking modes, hosted by several inference platforms.",
    labSlug: "alibaba-qwen",
    modelType: "REASONING",
    releaseDate: "2025-04-29",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.22,
    outputPricePerMTokUsd: 0.88,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Apache 2.0",
    knowledgeCutoff: "2024-12",
    providerSlugs: ["together-ai", "groq", "fireworks-ai", "openrouter"],
    capabilitySlugs: [...REASONING, "fine-tuning"],
    providerPricing: {
      groq: { inputPricePerMTokUsd: 0.25, outputPricePerMTokUsd: 0.95 },
    },
    scores: {
      mmlu: 87.0,
      "gpqa-diamond": 71.1,
      "swe-bench-verified": 34.4,
      "aime-2025": 85.7,
      ifeval: 84.9,
    },
  },
  {
    slug: "qwen3-32b",
    name: "Qwen3 32B",
    description:
      "A dense 32B Qwen3 release balancing reasoning quality against single-node serving costs.",
    labSlug: "alibaba-qwen",
    modelType: "REASONING",
    releaseDate: "2025-04-29",
    contextWindow: 131_072,
    maxOutputTokens: 32_768,
    inputPricePerMTokUsd: 0.1,
    outputPricePerMTokUsd: 0.3,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Apache 2.0",
    knowledgeCutoff: "2024-12",
    providerSlugs: ["together-ai", "groq", "fireworks-ai", "openrouter"],
    capabilitySlugs: [...REASONING, "fine-tuning"],
    scores: {
      mmlu: 82.6,
      "gpqa-diamond": 63.4,
      "swe-bench-verified": 26.1,
      "aime-2025": 79.5,
      ifeval: 80.2,
    },
  },
  {
    slug: "qwen2-5-72b-instruct",
    name: "Qwen2.5 72B Instruct",
    description:
      "A widely deployed instruction-tuned Qwen model with strong multilingual coverage and tool support.",
    labSlug: "alibaba-qwen",
    modelType: "GENERAL",
    releaseDate: "2024-09-19",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.35,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Qwen License",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 80.7,
      "gpqa-diamond": 49.8,
      "swe-bench-verified": 16.4,
      "aime-2025": 58.2,
      ifeval: 76.8,
    },
  },
  {
    slug: "qwen2-5-coder-32b",
    name: "Qwen2.5 Coder 32B",
    description:
      "A code-specialised Qwen model for completion, refactoring, and repository question answering.",
    labSlug: "alibaba-qwen",
    modelType: "CODING",
    releaseDate: "2024-11-12",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.18,
    outputPricePerMTokUsd: 0.18,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Apache 2.0",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: ["streaming", "tool-use", "structured-output", "fine-tuning"],
    scores: {
      mmlu: 75.2,
      "gpqa-diamond": 38.6,
      humaneval: 88.4,
      ifeval: 71.9,
    },
  },
  {
    slug: "qwen2-5-vl-72b",
    name: "Qwen2.5-VL 72B",
    description:
      "A vision-language Qwen model for document understanding, chart extraction, and visual question answering.",
    labSlug: "alibaba-qwen",
    modelType: "MULTIMODAL",
    releaseDate: "2025-01-26",
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 0.45,
    outputPricePerMTokUsd: 0.45,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: true,
    license: "Qwen License",
    knowledgeCutoff: "2024-10",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 79.4,
      "gpqa-diamond": 46.1,
      mmmu: 70.2,
      ifeval: 72.6,
    },
  },

  // ------------------------------------------------------------------- xAI
  {
    slug: "grok-4",
    name: "Grok 4",
    description:
      "xAI's flagship reasoning model with tool use and a large context window, served through the xAI API.",
    labSlug: "xai",
    modelType: "REASONING",
    releaseDate: "2025-07-09",
    contextWindow: 256_000,
    maxOutputTokens: 64_000,
    inputPricePerMTokUsd: 3,
    outputPricePerMTokUsd: 15,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2025-03",
    providerSlugs: ["xai-api", "openrouter"],
    capabilitySlugs: [...REASONING, "prompt-caching", "code-execution"],
    scores: {
      mmlu: 88.9,
      "gpqa-diamond": 83.1,
      "swe-bench-verified": 68.2,
      "aime-2025": 91.7,
      mmmu: 79.8,
      ifeval: 89.6,
    },
  },
  {
    slug: "grok-3",
    name: "Grok 3",
    description:
      "The previous Grok flagship, offering strong general knowledge and real-time X data integration.",
    labSlug: "xai",
    modelType: "GENERAL",
    releaseDate: "2025-02-19",
    contextWindow: 131_072,
    maxOutputTokens: 16_384,
    inputPricePerMTokUsd: 3,
    outputPricePerMTokUsd: 15,
    modalities: ["TEXT", "IMAGE", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-11",
    providerSlugs: ["xai-api", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "prompt-caching"],
    scores: {
      mmlu: 86.2,
      "gpqa-diamond": 72.4,
      "swe-bench-verified": 41.5,
      "aime-2025": 79.3,
      mmmu: 74.1,
      ifeval: 85.8,
    },
  },
  {
    slug: "grok-3-mini",
    name: "Grok 3 mini",
    description:
      "A compact reasoning-capable Grok tier for latency-sensitive chat and classification.",
    labSlug: "xai",
    modelType: "REASONING",
    releaseDate: "2025-02-19",
    contextWindow: 131_072,
    maxOutputTokens: 16_384,
    inputPricePerMTokUsd: 0.3,
    outputPricePerMTokUsd: 0.5,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: "2024-11",
    providerSlugs: ["xai-api", "openrouter"],
    capabilitySlugs: [...REASONING],
    scores: {
      mmlu: 80.5,
      "gpqa-diamond": 64.8,
      "swe-bench-verified": 30.2,
      "aime-2025": 72.6,
      ifeval: 80.7,
    },
  },

  // ---------------------------------------------------------------- Cohere
  {
    slug: "command-a",
    name: "Command A",
    description:
      "Cohere's enterprise generation model, tuned for retrieval-augmented answers and multilingual business workflows.",
    labSlug: "cohere",
    modelType: "GENERAL",
    releaseDate: "2025-03-13",
    contextWindow: 256_000,
    maxOutputTokens: 8_192,
    inputPricePerMTokUsd: 2.5,
    outputPricePerMTokUsd: 10,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "CC BY-NC 4.0",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["cohere-api", "amazon-bedrock", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "fine-tuning", "prompt-caching"],
    scores: {
      mmlu: 82.1,
      "gpqa-diamond": 56.3,
      "swe-bench-verified": 20.4,
      "aime-2025": 50.2,
      ifeval: 83.4,
    },
  },
  {
    slug: "command-r-plus",
    name: "Command R+",
    description:
      "A retrieval-focused Cohere model with citation-style grounding and tool use for enterprise RAG.",
    labSlug: "cohere",
    modelType: "GENERAL",
    releaseDate: "2024-04-04",
    contextWindow: 128_000,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 2.5,
    outputPricePerMTokUsd: 10,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "CC BY-NC 4.0",
    knowledgeCutoff: "2024-03",
    providerSlugs: ["cohere-api", "amazon-bedrock", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "fine-tuning"],
    scores: {
      mmlu: 78.6,
      "gpqa-diamond": 43.1,
      "swe-bench-verified": 14.7,
      "aime-2025": 38.5,
      ifeval: 80.2,
    },
  },
  {
    slug: "embed-v4",
    name: "Embed v4",
    description:
      "Cohere's multilingual embedding model for search and clustering, priced per input token only.",
    labSlug: "cohere",
    modelType: "EMBEDDING",
    releaseDate: "2025-04-15",
    contextWindow: 128_000,
    maxOutputTokens: null,
    inputPricePerMTokUsd: 0.12,
    outputPricePerMTokUsd: 0,
    modalities: ["TEXT"],
    isOpenWeights: false,
    license: "Proprietary",
    knowledgeCutoff: null,
    providerSlugs: ["cohere-api", "amazon-bedrock"],
    capabilitySlugs: ["batch-inference", "multilingual"],
  },

  // ------------------------------------------------------------- AI21 Labs
  {
    slug: "jamba-1-5-large",
    name: "Jamba 1.5 Large",
    description:
      "AI21's hybrid Mamba/transformer model with a 256K context, designed for long-document enterprise workloads.",
    labSlug: "ai21-labs",
    modelType: "GENERAL",
    releaseDate: "2024-08-22",
    contextWindow: 256_000,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 2,
    outputPricePerMTokUsd: 8,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Jamba Open Model License",
    knowledgeCutoff: "2024-03",
    providerSlugs: ["amazon-bedrock", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "fine-tuning"],
    scores: {
      mmlu: 79.4,
      "gpqa-diamond": 44.8,
      "swe-bench-verified": 15.2,
      "aime-2025": 42.6,
      ifeval: 78.9,
    },
  },
  {
    slug: "jamba-1-5-mini",
    name: "Jamba 1.5 Mini",
    description:
      "A smaller Jamba variant for long-context extraction and summarisation at a fraction of the large model's cost.",
    labSlug: "ai21-labs",
    modelType: "GENERAL",
    releaseDate: "2024-08-22",
    contextWindow: 256_000,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 0.2,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "Jamba Open Model License",
    knowledgeCutoff: "2024-03",
    providerSlugs: ["amazon-bedrock", "openrouter"],
    capabilitySlugs: [...CORE_CHAT, "fine-tuning"],
    scores: {
      mmlu: 73.8,
      "gpqa-diamond": 35.2,
      "swe-bench-verified": 9.6,
      "aime-2025": 30.4,
      ifeval: 72.1,
    },
  },

  // ----------------------------------------------------------- Microsoft AI
  {
    slug: "phi-4",
    name: "Phi-4",
    description:
      "A 14B open-weight model trained on curated synthetic and textbook data, strong on math for its size.",
    labSlug: "microsoft-ai",
    modelType: "REASONING",
    releaseDate: "2024-12-12",
    contextWindow: 16_384,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 0.07,
    outputPricePerMTokUsd: 0.14,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "MIT",
    knowledgeCutoff: "2024-06",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: ["streaming", "tool-use", "structured-output", "fine-tuning"],
    scores: {
      mmlu: 80.4,
      "gpqa-diamond": 56.1,
      "swe-bench-verified": 17.8,
      "aime-2025": 62.3,
      ifeval: 79.6,
    },
  },
  {
    slug: "phi-4-multimodal",
    name: "Phi-4 Multimodal",
    description:
      "A compact open-weight model that adds image and audio input to the Phi-4 text backbone.",
    labSlug: "microsoft-ai",
    modelType: "MULTIMODAL",
    releaseDate: "2025-02-26",
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 0.08,
    outputPricePerMTokUsd: 0.2,
    modalities: ["TEXT", "IMAGE", "AUDIO", "CODE"],
    isOpenWeights: true,
    license: "MIT",
    knowledgeCutoff: "2024-08",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: ["streaming", "tool-use", "structured-output", "fine-tuning"],
    scores: {
      mmlu: 76.2,
      "gpqa-diamond": 45.7,
      "swe-bench-verified": 12.4,
      mmmu: 60.8,
      ifeval: 74.3,
    },
  },

  // ---------------------------------------------------------------- NVIDIA
  {
    slug: "nemotron-4-340b",
    name: "Nemotron-4 340B",
    description:
      "NVIDIA's large open-weight model, notable for a permissive licence intended for synthetic data generation.",
    labSlug: "nvidia",
    modelType: "GENERAL",
    releaseDate: "2024-06-14",
    contextWindow: 4_096,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 0.9,
    outputPricePerMTokUsd: 0.9,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "NVIDIA Open Model License",
    knowledgeCutoff: "2023-12",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 78.7,
      "gpqa-diamond": 41.2,
      "swe-bench-verified": 10.8,
      "aime-2025": 38.9,
      ifeval: 77.4,
    },
  },
  {
    slug: "llama-3-1-nemotron-70b",
    name: "Llama 3.1 Nemotron 70B",
    description:
      "NVIDIA's instruction-tuned Llama 3.1 variant, optimised for helpfulness and tool calling.",
    labSlug: "nvidia",
    modelType: "GENERAL",
    releaseDate: "2024-10-15",
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    inputPricePerMTokUsd: 0.35,
    outputPricePerMTokUsd: 0.4,
    modalities: ["TEXT", "CODE"],
    isOpenWeights: true,
    license: "NVIDIA Open Model License",
    knowledgeCutoff: "2023-12",
    providerSlugs: ["together-ai", "fireworks-ai", "openrouter"],
    capabilitySlugs: OPEN_MODEL,
    scores: {
      mmlu: 80.1,
      "gpqa-diamond": 48.6,
      "swe-bench-verified": 18.2,
      "aime-2025": 52.7,
      ifeval: 81.3,
    },
  },
];
