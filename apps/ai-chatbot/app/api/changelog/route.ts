import { convertToModelMessages, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

type RefinedArticle = {
  title: string;
  content: string;
  link: string;
  launchDate: string;
};
type Article = {
  title: string;
  htmlContent: string;
  markdownContent: string;
  link: string;
  launchDate: string;
  timestamp: number;
};

let articlesRag: RefinedArticle[] = [];

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

async function getVercelChangelogFromBlob(): Promise<Article[]> {
  const response = await fetch(
    "https://xefbf5ydcrobj1vo.public.blob.vercel-storage.com/changelog/vercel-changelog.json",
  );
  const articles = await response.json();
  return articles;
}

async function getRefinedArticles() {
  if (articlesRag.length === 0) {
    const articles = await getVercelChangelogFromBlob();
    articlesRag = articles.map((article) => {
      return {
        title: article.title,
        link: article.link,
        launchDate: article.launchDate,
        content: article.markdownContent,
      };
    });
  }
  return articlesRag;
}
