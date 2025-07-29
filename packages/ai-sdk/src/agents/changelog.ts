import { generateObject, generateText, Tool, streamText } from "ai";
import { getVercelChangelogFromBlob } from "../rags/changelog";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { tool } from "ai";
import { rangeDetectorSchema, ZodrangeDetectorSchema } from "./rangeDetector";

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
 * @param model - The model to use
 * @returns The response from the changelog AI
 */
async function askChangelogAI(
  prompt: string,
  dateRange: z.infer<typeof ZodrangeDetectorSchema>,
  model: string = "openai/gpt-4.1-nano",
) {
  const changelogInstructions = `
Your name is Vercel Changelog Agent.
You answer questions about Vercel's changelog articles and recent feature launches. Always follow STEP 1 and STEP 2 in order, streaming STEP 1 first and STEP 2 second.

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
  // First step: Generate marketing copy
  return await generateText({
    model: gateway(model),
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
  name: "askChangelogAi",
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
Rules:
- If the prompt mentions "guide" or "guidelines", include "guidelines".
- If the prompt mentions "documentation" or "docs", include "docs".
- If the prompt mentions "blog post" or "blog posts", include both "blogs".
- If multiple categories are mentioned, include all relevant sources with no duplicates.
- Only include sources explicitly indicated by the prompt's keywords.
Return a plain array of site source strings. Do not include anything else.
    `,
    prompt,
    schema: z.object({
      sources: z.array(z.string()),
    }),
  });
  // De-duplicate for safety
  return Array.from(new Set(object.sources));
}

/**
 * Create a tool to get extra references section to append to the response
 * @param sources - The sources to search the web for
 * @returns The tool to get extra references section to append to the response
 */
function createExtraReferencesTool(sources: string[]): {
  getExtraReferences?: Tool;
} {
  // Only keep valid sites for filter
  const allowedDomains = sources;

  return {
    getExtraReferences: tool({
      name: "getExtraReferences",
      description: "Get extra references section to append to the response.",
      inputSchema: z.object({
        response: z
          .string()
          .describe("The response to append the extra references to"),
      }),
      execute: async ({ response }) => {
        if (allowedDomains.length === 0) {
          return "---";
        }

        const perplexitySystemPrompt = `
# JOB DESCRIPTION:
- You are a web search bot that retrieves up to 5 references ONLY from the specified domains.
- Do NOT include any references from domains  differnet than ${allowedDomains.join(", ")}.
- Each reference should be a sentence summarizing the content of the article.
- If no valid references are found, reply: "No additional references available from the specified domains."

# FINAL VERIFICATION:
- All your references are from the domains ${allowedDomains.join(", ")}. Remove the entire reference if it is not 100%from the domains ${allowedDomains.join(", ")}.
- The entire response should be in markdown format.
- Do not include the original prompt in the response.
- Format the response as a markdown response".
`;

        const { text: initialResponse, sources: preplexitySources } =
          await generateText({
            model: gateway("perplexity/sonar"),
            system: perplexitySystemPrompt,
            prompt: response,
            providerOptions: {
              search_domain_filter: allowedDomains,
            } as any,
          });

        const references = preplexitySources
          .map(
            (source: any, index: number) => `- [${index + 1}](${source.url})`,
          )
          .join("\n\n");
        return `${initialResponse} ${references}`;
        // const rewriteInstructions = `
        // # DESCRIPTION:
        // You are a markdown modifier and sources verifier bot that can add links to the prompt based on the sources provided. The numbers in the prompt are the source numbers.
        // For example:
        // - Remove any references and responses from domains other than ${allowedDomains.join(", ")}.
        // - if the prompt contains [1] it means that the source is the first one in the sources array, etc.
        // - if the prompt contains [2] it means that the source is the second one in the sources array, etc.
        // - if the prompt contains [3] it means that the source is the third one in the sources array, etc.
        // - Add parenthesys around the numbers as part of the link text so it looks like [(number)](url)
        // - You always return the prompt with the links added.
        // - The entire response should be in markdown format.`;
        // const { text: rewrittenPrompt } = await generateText({
        //   model: gateway("openai/gpt-4.1-nano"),
        //   system: rewriteInstructions,
        //   prompt: JSON.stringify({
        //     prompt: initialResponse,
        //     sources: preplexitySources,
        //   }),
        // });

        // try {
        //   console.log(">>>rewrittenPrompt", "VALID JSON");
        //   const rewrittenPromptJson = JSON.parse(rewrittenPrompt);
        //   return `${sources.length > 0 ? "## Additional References \n\n" : ""}
        //   ${rewrittenPromptJson.prompt}
        //   `;
        // } catch {
        //   return rewrittenPrompt;
        // }
      },
    }),
  };
}

/**
 * Get the Vercel Perplexity tools
 * @returns The Vercel Perplexity tools
 */
function getVercelPerplexityTools(): Record<string, Tool> {
  return {
    getChangelogs,
  };
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
  createExtraReferencesTool,
  getVercelPerplexityTools,
};
