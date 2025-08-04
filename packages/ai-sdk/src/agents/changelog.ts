import { generateObject, generateText, Tool, streamText } from "ai";
import { getVercelChangelogFromBlob } from "../rags/changelog";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { tool } from "ai";
import { ZodrangeDetectorSchema } from "./rangeDetector";

type RefinedArticle = {
  title: string;
  // content: string;
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
        // content: article.markdownContent,
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
  model: string = "openai/gpt-4.1-mini",
) {
  const changelogInstructions = `
Your name is Vercel Changelog Agent.
You answer questions about Vercel's changelog articles and recent feature launches.

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
- Format your answer in markdown.
- For each relevant article:
  - Use the title as a clickable hyperlink to the article.
  - Write at most 2 sentences describing it.
  - Include the article's release date.
  - Do NOT include any images.

---
`;

  // Return a complete response - streaming is handled by the main streamText call
  return await generateText({
    model: gateway(model),
    temperature: 0.5,
    maxOutputTokens: 32000,
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
    return askChangelogAI(prompt, dateRange);
  },
});

/**
 * Determine the sources to expand the search to
 * @param prompt - The prompt to determine the sources to expand the search to
 * @returns The sources to expand the search to
 */
async function determineSources(prompt: string): Promise<string[]> {
  const { object } = await generateObject({
    model: gateway("openai/gpt-4.1-nano"),
    system: `
You are a bot that generates an array of search source site strings based on keywords found in the user's prompt.
## Rules:
- If the prompt mentions "guide" or "guidelines", include "guidelines".
- If the prompt mentions "documentation" or "docs", include "docs".
- If the prompt mentions "blog post" or "blog posts", include both "blogs".
- If multiple categories are mentioned, include all relevant sources with no duplicates.
- If none of the above are mentioned, return an empty array.
- Only include sources that are one of the following: "blogs", "guides", "docs".
## OUTPUT:
Return a plain array of site source strings. Do not include anything else.
    `,
    prompt,
    temperature: 0,
    schema: z.object({
      sources: z.array(z.string()),
    }),
  });
  // De-duplicate for safety
  return Array.from(new Set(object.sources));
}

// Only allowed URL prefixes—update as needed for each content type
const URL_PATTERNS: Record<string, string[]> = {
  Blogs: ["https://vercel.com/blog/", "https://nextjs.org/blog/"],
  Guides: ["https://vercel.com/guides/"],
  Docs: ["https://vercel.com/docs/"],
};

// Generates the strict system prompt for reference extraction
function generateSystemPrompt(toolName: string): string {
  const allowedUrls = URL_PATTERNS;
  return `
You are a markdown reference assistant taht search the web based on the user's prompt and ONLY extracts items where the URL starts with one of:
${allowedUrls}

If you find zero valid URLs, reply: "No additional references available from the specified domains."
Never guess, rewrite, paraphrase, or summarize sources.

Format:
---
## ${toolName} EXTRACT
- [Title](link) - one or two sentence summary.
- ...
---

No results? Reply only: "No additional references available from the specified domains."

Only output valid references, nothing else.
`;
}

function getVercelPerplexityTools(
  changelogResponse: string | null,
): Record<string, Tool> {
  const tools: Record<string, Tool> = {};

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
        console.log(
          ">>>",
          "...",
          (changelogResponse + "").split(" ").slice(0, 4).join(" ") +
            changelogResponseTool,
          "...",
        );
        const systemPrompt = generateSystemPrompt(toolName);
        const result = await generateText({
          model: "perplexity/sonar",
          temperature: 0,
          system: systemPrompt,
          prompt: changelogResponse
            ? changelogResponseTool + "\n\n" + changelogResponse + " "
            : `Find any Vercel references about ${changelogResponseTool}`,
          providerOptions: {
            search_domain_filter: ["vercel.com", "nextjs.org"],
          } as any,
        });

        return result;
      },
    });
  }

  // Add getChangelogs tool as before if defined elsewhere
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
