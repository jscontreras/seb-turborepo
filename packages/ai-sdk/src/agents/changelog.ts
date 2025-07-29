import { generateObject, generateText, Tool } from "ai";
import { getVercelChangelogFromBlob } from "../rags/changelog";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { tool } from "ai";
import { rangeDetectorSchema } from "./rangeDetector";

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
  dateRange: z.infer<typeof rangeDetectorSchema>,
  model: string = "openai/gpt-4o",
) {
  const changelogInstructions = `You are an agent that answers questions about Vercel's changelog articles that always runs STEP 1 and STEP 2.
  Here are the articles you can refer to as a JSON array:
  \`\`\`json
  ${JSON.stringify(await getRefinedArticles())}
  \`\`\`
  respond in html format only refering to the articles you can find in the JSON array
  WHen presenting the articles please include:
  - the title of the article
  - the link using the title of the article.
  - the release date of the article.
  - a paragraph summarizing the content of the article unless the user ask for more details or a specific feature with sentences like "Give me more details about the feature" or "Give me a detailed description of the feature".
  `;
  // First step: Generate marketing copy
  const { text } = await generateText({
    model: gateway("openai/gpt-4.1-nano"),
    maxOutputTokens: 32000,
    system: changelogInstructions,
    prompt: prompt,
  });
  return text;
}

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
- If the prompt mentions "guide" or "guidelines", include ":site:https://vercel.com/guides".
- If the prompt mentions "documentation" or "docs", include ":site:https://vercel.com/docs".
- If the prompt mentions "blog post" or "blog posts", include both ":site:https://vercel.com/blog" and ":site:https://nextjs.org/blog".
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
};
