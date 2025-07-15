import { convertToModelMessages, streamText } from "ai";
import {
  getRefinedArticles,
  RefinedArticle,
} from "@repo/ai-sdk/agents/changelog";
import { openai } from "@ai-sdk/openai";

let articles: RefinedArticle[] = [];

function createChangelogInstructions(articles: RefinedArticle[]) {
  return `You are an agent that answers questions about Vercel's changelog articles or latest launched features from Vercel.
  As a reference, today is ${new Date().toISOString().split("T")[0]}.
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

export async function POST(req: Request) {
  if (articles.length === 0) {
    articles = await getRefinedArticles();
    articles = articles;
  }
  const { messages } = await req.json();
  console.log("articles.length>>>", articles.length);
  const result = streamText({
    model: openai("gpt-4.1-nano"),
    maxOutputTokens: 32000,
    system: createChangelogInstructions(articles),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
