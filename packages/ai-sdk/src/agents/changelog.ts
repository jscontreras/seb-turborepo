import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getVercelChangelogFromBlob } from "../rags/changelog";
type RefinedArticle = {
  title: string;
  content: string;
  link: string;
  launchDate: string;
};
let articlesRag: RefinedArticle[] = [];

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

async function askChangelogAI(prompt: string) {
  const changelogInstructions = `You are an agent that answers questions about Vercel's changelog articles .
  Here are the articles you can refer to as a JSON array:
  \`\`\`json
  ${JSON.stringify(await getRefinedArticles())}
  \`\`\`
  respond in markdown format only refering to the articles you can find in the JSON array
  including the link to the article.
  Include the release date of the article.`;
  // First step: Generate marketing copy
  const { text } = await generateText({
    model: openai("o4-mini"),
    system: changelogInstructions,
    prompt: prompt,
  });
  return text;
}
