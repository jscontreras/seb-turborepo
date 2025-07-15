import { convertToModelMessages, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getRefinedArticles } from "@repo/ai-sdk/agents/changelog";

const changelogInstructions = `You are an agent that answers questions about Vercel's changelog articles or latest launched features from Vercel.
  Here are the articles you can refer to as a JSON array:
  \`\`\`json
  ${JSON.stringify(await getRefinedArticles())}
  \`\`\`
  respond in markdown format only refering to the articles you can find in the JSON array
  including the link to the article.
  Include the release date of the article.
  Don't include any image in the response.
  Include the entire content of the article`;

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: changelogInstructions,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
