import { convertToModelMessages, generateText, streamText, tool } from "ai";
import {
  getRefinedArticles,
  RefinedArticle,
  determineSources,
  createExtraReferencesTool,
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
${
  sources.length > 0
    ? `
# RESPONSE INSTRUCTIONS:
Respond in two clearly separated streamed sections:

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

## EXTRA REFERENCES
- After CHANGELOG EXTRACT section is complete, stream only this section.
- Use the getExtraReferences tool to generate references.
- At the end of the response, include a **References** section:
  - For each referenced article, list the title as a clickable link.
  - Never omit, merge, or remove the References section.
  - Only include references not included in the changelog extract.

---

Always stream CHANGELOG EXTRACT fully first, then EXTRA REFERENCES. Never blend the two sections.
`
    : `
# RESPONSE INSTRUCTIONS:
Respond in a single section:

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
`
}  `;
}

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;
const maxNumberOfArticles = 300;
let activateWebSearch = false;

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
    let rangedPrompt = await rewriteRelativeDates(lastUserMessage);
    // If dates are found
    if (rangedPrompt !== lastUserMessage) {
      const rangeObjectResponse = await detectRange(rangedPrompt);
      console.log("rangeObjectResponse", rangeObjectResponse);
      const rangeObject = rangeObjectResponse.notifications[0];
      if (rangeObject.isRangeInPrompt) {
        activateWebSearch = true;
        let startDateTimestamp = null;
        let endDateTimestamp = null;
        if (rangeObject.startDate) {
          startDateTimestamp = new Date(rangeObject.startDate).getTime();
        }
        if (rangeObject.endDate) {
          endDateTimestamp = new Date(rangeObject.endDate).getTime();
        }

        if (startDateTimestamp !== null || endDateTimestamp !== null) {
          if (startDateTimestamp !== null && endDateTimestamp !== null) {
            if (rangeObject.startDate !== rangeObject.endDate) {
              promptArticles = promptArticles.filter((article) => {
                const articleTimestamp = article.launchDateTimestamp;
                if (startDateTimestamp !== null && endDateTimestamp !== null) {
                  return (
                    articleTimestamp >= startDateTimestamp &&
                    articleTimestamp <= endDateTimestamp
                  );
                } else if (startDateTimestamp !== null) {
                  return articleTimestamp >= startDateTimestamp;
                } else if (endDateTimestamp !== null) {
                  return articleTimestamp <= endDateTimestamp;
                }
                return true;
              });
            }
          }
        }
      }
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
  // sources = await determineSources(lastUserMessage);
  // console.log(">>>sources", sources);

  const result = streamText({
    model: gateway("gpt-4.1-mini"),
    maxOutputTokens: 32000,
    system: createChangelogInstructions(promptArticles, sources),
    messages: convertToModelMessages(messages),
    tools: {
      ...createExtraReferencesTool(sources),
    },
  });
  return result.toUIMessageStreamResponse();
}
