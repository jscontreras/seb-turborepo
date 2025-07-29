import { convertToModelMessages, generateText, streamText, tool } from "ai";
import {
  getRefinedArticles,
  RefinedArticle,
  determineSources,
  createExtraReferencesTool,
  filterArticlesByDateRange,
} from "@repo/ai-sdk/agents/changelog";
import {
  detectRange,
  rewriteRelativeDates,
} from "@repo/ai-sdk/agents/rangeDetector";
import { gateway } from "@ai-sdk/gateway";
import { openai } from "@ai-sdk/openai";
import z from "zod";

let articles: RefinedArticle[] = [];

function createChangelogInstructions(
  articles: RefinedArticle[],
  sources: string[],
) {
  return `
Your name is Vercel Changelog Agent.
You answer questions about Vercel's changelog articles and recent feature launches. Always follow STEP 1 and STEP 2 in order, streaming STEP 1 first and STEP 2 second.

IMPORTANT:
- Unless the user specifies otherwise, always process and answer using the list of articles sorted chronologically from most recent to least recent, even when grouping into categories.

# INPUTS:
- Today's date: ${new Date().toISOString().split("T")[0]}
- List of articles (JSON):
\`\`\`json
${JSON.stringify(articles)}
\`\`\`
- Web search sources (JSON):
\`\`\`json
${JSON.stringify(sources)}
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
}

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;
const maxNumberOfArticles = 300;
let activateWebSearch = false;

/**
 * POST request handler for the changelog API
 * @param req - The request object
 * @returns The response object
 */
export async function POST(req: Request) {
  if (articles.length === 0) {
    articles = await getRefinedArticles();
    articles = articles;
  }
  let promptArticles = [...articles];
  const { messages, trigger } = await req.json();
  const message = messages[messages.length - 1];
  let lastUserMessage = null;
  if (trigger === "submit-message") {
    lastUserMessage = message.parts
      .filter((part: { type: string }) => part.type === "text")
      .map((part: { text: any }) => part.text)
      .join("");
  }
  if (lastUserMessage) {
    try {
      let rangedPrompt = await rewriteRelativeDates(lastUserMessage);
      // If dates are found
      if (rangedPrompt !== lastUserMessage) {
        const rangeObjectResponse = await detectRange(rangedPrompt);
        console.log("rangeObjectResponse", rangeObjectResponse);
        const rangeObject = rangeObjectResponse.notifications[0];
        promptArticles = filterArticlesByDateRange(rangeObject, promptArticles);
      }
    } catch (error) {
      console.error("Error in range detection:", error);

      // Determine the type of error and provide appropriate message
      let errorMessage =
        "Failed to process date range. Please try again with a different query.";
      let errorType = "range_detection";

      if (error instanceof Error) {
        if (
          error.message.includes("rate limit") ||
          error.message.includes("quota")
        ) {
          errorMessage =
            "Service temporarily unavailable due to high demand. Please try again in a moment.";
          errorType = "rate_limit";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please try again with a simpler query.";
          errorType = "timeout";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
          errorType = "network";
        }
      }

      // Return an error response that the UI can handle
      return new Response(
        JSON.stringify({
          error: errorMessage,
          errorType: errorType,
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
  // If the number of articles is less than 20, we can activate the web search
  activateWebSearch = activateWebSearch && promptArticles.length < 20;

  if (lastUserMessage && lastUserMessage.includes("force-web-search")) {
    activateWebSearch = true;
  }

  if (lastUserMessage && lastUserMessage.includes("full-list")) {
    promptArticles = articles;
  }

  console.log(
    "ArticlesOptimization",
    promptArticles.length,
    " of ",
    articles.length,
    " articles",
    " activateWebSearch",
    activateWebSearch,
  );

  // If the question is not a date range, we can use all the articles but with a limit of 150 articles for performance reasons
  if (promptArticles.length === articles.length) {
    promptArticles = promptArticles.slice(0, maxNumberOfArticles);
  }
  // Determine the sources to search the web for
  let sources: string[] = [];
  try {
    sources = await determineSources(lastUserMessage);
    console.log(">>>sources", sources);
  } catch (error) {
    console.error("Error determining sources:", error);
    // Continue without sources rather than failing completely
    sources = [];
  }

  try {
    const result = streamText({
      model: gateway("gpt-4.1-mini"),
      maxOutputTokens: 32000,
      system: createChangelogInstructions(promptArticles, sources),
      messages: convertToModelMessages(messages),
      tools: {
        ...createExtraReferencesTool(sources),
      },
      toolChoice: "auto",
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in streamText:", error);

    // Determine the type of error and provide appropriate message
    let errorMessage = "Failed to generate response. Please try again.";
    let errorType = "generation";

    if (error instanceof Error) {
      if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        errorMessage =
          "Service temporarily unavailable due to high demand. Please try again in a moment.";
        errorType = "rate_limit";
      } else if (error.message.includes("timeout")) {
        errorMessage =
          "Request timed out. Please try again with a simpler query.";
        errorType = "timeout";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
        errorType = "network";
      } else if (
        error.message.includes("model") ||
        error.message.includes("gpt")
      ) {
        errorMessage =
          "AI model temporarily unavailable. Please try again in a moment.";
        errorType = "model";
      }
    }

    // Return an error response that the UI can handle
    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorType: errorType,
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
