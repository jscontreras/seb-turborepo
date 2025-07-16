import { convertToModelMessages, streamText } from "ai";
import {
  getRefinedArticles,
  RefinedArticle,
} from "@repo/ai-sdk/agents/changelog";
import { openai } from "@ai-sdk/openai";
import {
  detectRange,
  rewriteRelativeDates,
} from "@repo/ai-sdk/agents/rangeDetector";

let articles: RefinedArticle[] = [];

function createChangelogInstructions(
  articles: RefinedArticle[],
  suggestWebSearch = false,
) {
  return `Your name is Vercel  Changelog Agent. You are an agent that answers questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions about Vercel's changelog articles or latest launched features from Vercel.  You are a helpful assistant that can answer questions
  As a reference, today is ${new Date().toISOString().split("T")[0]}.
  {${suggestWebSearch ? 'Give priority to the article\'s JSON but if you feel like you need to search the web for more information, make sure you include "Vercel Features" in the search query, you can use the web_search_preview tool.' : "Base your response on the articles JSON information"}
  Here are the list of articles you can refer to as a JSON array:
  \`\`\`json
  ${JSON.stringify(articles)}
  \`\`\`
  respond in markdown format using the articles data you can find in the JSON array following the instructions:
  Include the link to the article in the response with the title of the article.
  Include the release date of the article.
  Don't include any image in the response.
  Include the entire markdown content of the article`;
}

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;
const maxNumberOfArticles = 100;
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
  if (trigger === "submit-user-message") {
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
  // If the number of articles is less than 20, we can activate the web search
  activateWebSearch = activateWebSearch && promptArticles.length < 20;
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

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    maxOutputTokens: 32000,
    system: createChangelogInstructions(promptArticles, activateWebSearch),
    messages: convertToModelMessages(messages),
    ...(activateWebSearch
      ? {
          tools: {
            web_search_preview: openai.tools.webSearchPreview({
              // optional configuration:
              searchContextSize: "high",
              userLocation: {
                type: "approximate",
                city: "San Francisco",
                region: "California",
              },
            }),
          },
        }
      : {}),
  });
  result.consumeStream();
  return result.toUIMessageStreamResponse();
}
