import { generateObject, generateText, Tool, streamText } from "ai";
import { getVercelChangelogFromBlob } from "../rags/changelog";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { tool } from "ai";
import { ZodrangeDetectorSchema } from "./rangeDetector";

type RefinedArticle = {
  title: string;
  content: string;
  link: string;
  launchDate: string;
  launchDateTimestamp: number;
};
let articlesRag: RefinedArticle[] = [];

async function getRefinedArticles() {
  if (articlesRag.length === 0) {
    const articles = await getVercelChangelogFromBlob();
    articlesRag = articles.map((article) => {
      const refinedArticle: RefinedArticle = {
        title: article.title,
        link: article.link,
        launchDate: article.launchDate,
        content: article.markdownContent,
        launchDateTimestamp: new Date(article.launchDate).getTime(),
      };
      return refinedArticle;
    });
  }
  return articlesRag;
}
/**
 * Ask the changelog AI
 * @param prompt - The prompt to ask the changelog AI
 * @param dateRange - The date range to filter articles
 * @param model - The model to use
 * @returns The response from the changelog AI
 */
async function askChangelogAI(
  prompt: string,
  dateRange: z.infer<typeof ZodrangeDetectorSchema>,
  model: string | undefined = undefined,
) {
  // Use NANO_MODEL for faster performance (faster than MINI_MODEL)
  // This function processes structured RAG data, so a faster model is sufficient
  const modelToUse = model || process.env.NANO_MODEL || "openai/gpt-4.1-mini";
  const changelogInstructions = `
Your name is Vercel Changelog Agent.
You answer questions about Vercel's changelog articles and recent feature launches.
You always answer classifying the articles into categories to make it easier for the user to understand the changes.

IMPORTANT:
- Unless the user specifies otherwise, always process and answer using the list of articles sorted chronologically from most recent to least recent, even when grouping into categories.

# INPUTS:
- Today's date: ${new Date().toISOString().split("T")[0]}
- List of articles (JSON):
  \`\`\`json
  ${JSON.stringify(
    filterArticlesByDateRange(dateRange, await getRefinedArticles()),
  )}
  \`\`\`

# RESPONSE INSTRUCTIONS:
Respond in a single section making sure that the articles are sorted by release date from most recent to least recent, so the most recent article is the first one.
---

## CHANGELOG EXTRACT
- Answer the user question using only the provided articles JSON array.
- Format your answer in markdown using categories to make it easier for the user to understand the changes.
- For each relevant article:
  - Use the title as a clickable hyperlink to the article.
  - Write at most 2 sentences describing it.
  - Include the article's release date.
  - Do NOT include any images.

---
`;

  // Return a complete response - streaming is handled by the main streamText call
  // Use faster model and reduce token limit for better performance
  return await generateText({
    model: gateway(modelToUse),
    temperature: 0.5,
    maxOutputTokens: 8000, // Reduced from 32000 - sufficient for changelog summaries
    system: changelogInstructions,
    prompt: prompt,
  });
}

/**
 * A tool to ask the changelog AI
 * @returns The tool to ask the changelog AI
 */
const getChangelogs = tool({
  name: "getChangelogs",
  description: "Ask about Vercel's changelog articles",
  inputSchema: z.object({
    prompt: z.string(),
    dateRange: ZodrangeDetectorSchema,
  }),
  execute: async ({ prompt, dateRange }) => {
    try {
      const result = await askChangelogAI(prompt, dateRange);
      // Return just the text to ensure consistent serialization
      const text = result?.text;
      if (!text) {
        console.error("getChangelogs: result.text is empty", result);
        return "No changelog content available.";
      }
      return text;
    } catch (error) {
      console.error("getChangelogs error:", error);
      return `Error retrieving changelog: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

// Content type mapping - keys must match what determineSources returns
const CONTENT_TYPES = {
  blogs: "Blogs",
  guides: "Guides",
  docs: "Docs",
} as const;

type ContentType = keyof typeof CONTENT_TYPES;

// Only allowed URL prefixes—update as needed for each content type
const URL_PATTERNS: Record<string, string[]> = {
  Blogs: ["https://vercel.com/blog/", "https://vercel.com/kb/"],
  Guides: ["https://vercel.com/kb/"],
  Docs: ["https://vercel.com/docs/"],
};

/**
 * Determine the sources to expand the search to
 * @param prompt - The prompt to determine the sources to expand the search to
 * @returns The sources to expand the search to
 */
async function determineSources(prompt: string): Promise<ContentType[]> {
  const { object } = await generateObject({
    model: gateway(process.env.NANO_MODEL || "openai/gpt-4.1-nano"),
    system: `
You are a bot that generates an array of search source site strings based on keywords found in the user's prompt.
## Rules:
- If the prompt mentions "guide" or "guidelines", include "guides".
- If the prompt mentions "documentation" or "docs", include "docs".
- If the prompt mentions "blog post" or "blog posts", include "blogs".
- If multiple categories are mentioned, include all relevant sources with no duplicates.
- If none of the above are mentioned, return an empty array.
- Only include sources that are one of the following: "blogs", "guides", "docs".
## OUTPUT:
Return a plain array of site source strings. Do not include anything else.
    `,
    prompt,
    temperature: 0,
    schema: z.object({
      sources: z.array(z.enum(["blogs", "guides", "docs"])),
    }),
  });
  // De-duplicate and validate
  const uniqueSources = Array.from(new Set(object.sources));
  return uniqueSources.filter((s): s is ContentType => s in CONTENT_TYPES);
}

/**
 * Generates the strict system prompt for reference extraction
 * @param toolName - The name of the tool (e.g., "Blogs", "Guides", "Docs")
 * @returns The formatted system prompt
 */
function generateSystemPrompt(toolName: string): string {
  const allowedUrls = URL_PATTERNS[toolName] || [];
  const urlList = allowedUrls.map((url) => `- ${url}`).join("\n");

  return `You are a markdown reference assistant that searches the web based on the user's prompt and ONLY extracts items where the URL starts with one of:
${urlList}

If you find zero valid URLs, reply: "No additional references available from the specified domains."
Never guess, rewrite, paraphrase, or summarize sources.

Format:
---
## ${toolName} EXTRACT
- [Title](link) - one or two sentence summary.
- ...
---

No results? Reply only: "No additional references available from the specified domains."

Only output valid references, nothing else.`;
}

/**
 * Get Vercel Perplexity tools for searching blogs, guides, and docs
 * @param changelogResponse - Optional changelog response to provide context
 * @returns Record of tools for searching different content types
 */
function getVercelPerplexityTools(
  changelogResponse: string | null,
): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

  // Use sonar-pro for better quality, fallback to sonar for speed/cost
  const perplexityModel =
    process.env.PERPLEXITY_MODEL || "perplexity/sonar-pro";

  for (const toolName of Object.keys(URL_PATTERNS)) {
    tools[`get${toolName}`] = tool({
      name: toolName,
      description: `Get ${toolName} references from official Vercel sources`,
      inputSchema: z.object({
        changelogResponseTool: z
          .string()
          .describe(
            "The response result from the getChangelogs tool previously executed. Do not include the user prompt or any other text.",
          ),
      }),
      execute: async ({
        changelogResponseTool,
      }: {
        changelogResponseTool: string;
      }) => {
        if (!changelogResponse && !changelogResponseTool) {
          return "No changelog context or response available.";
        }

        try {
          const systemPrompt = generateSystemPrompt(toolName);

          // Construct a clear, focused prompt
          const searchPrompt = changelogResponse
            ? `${changelogResponseTool}\n\nBased on the changelog context above, find relevant ${toolName.toLowerCase()} from Vercel's official sources.`
            : `Find Vercel ${toolName.toLowerCase()} references about: ${changelogResponseTool}`;

          // Perplexity-specific provider options
          // Note: search_domain_filter is a Perplexity-specific option
          const result = await generateText({
            model: perplexityModel,
            temperature: 0,
            system: systemPrompt,
            prompt: searchPrompt,
            providerOptions: {
              search_domain_filter: {
                '0': "vercel.com",
                '1': "nextjs.org"
              },
            },
          });

          return result.text;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`Error fetching ${toolName}:`, errorMessage);
          return `Error retrieving ${toolName.toLowerCase()}: ${errorMessage}`;
        }
      },
    });
  }

  // Add getChangelogs tool
  tools.getChangelogs = getChangelogs;

  return tools;
}

/**
 * Filter the articles by date range
 * @param rangeObject - The range object
 * @param articles - The articles to filter
 * @returns The filtered articles
 */
function filterArticlesByDateRange(
  rangeObject: any,
  articles: { launchDateTimestamp: number }[],
): any[] {
  if (!rangeObject.isRangeInPrompt) return articles;

  let startDateTimestamp = rangeObject.startDate
    ? new Date(rangeObject.startDate).getTime()
    : null;
  let endDateTimestamp = rangeObject.endDate
    ? new Date(rangeObject.endDate).getTime() + 24 * 60 * 60 * 1000
    : null;

  if (
    startDateTimestamp !== null &&
    endDateTimestamp !== null &&
    rangeObject.startDate !== rangeObject.endDate
  ) {
    return articles.filter((article) => {
      const articleTimestamp = article.launchDateTimestamp;
      return (
        (startDateTimestamp !== null
          ? articleTimestamp >= startDateTimestamp
          : true) &&
        (endDateTimestamp !== null
          ? articleTimestamp <= endDateTimestamp
          : true)
      );
    });
  }

  return articles;
}

export {
  askChangelogAI,
  getRefinedArticles,
  determineSources,
  filterArticlesByDateRange,
  type RefinedArticle as RefinedArticle,
  getVercelPerplexityTools,
};
