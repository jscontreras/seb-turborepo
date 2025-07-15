import { generateText } from "ai";
import { getVercelChangelogFromBlob } from "../rags/changelog";

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

async function askChangelogAI(prompt: string, model: string = "openai/gpt-4o") {
  const changelogInstructions = `You are an agent that answers questions about Vercel's changelog articles .
  Here are the articles you can refer to as a JSON array:
  \`\`\`json
  ${JSON.stringify(await getRefinedArticles())}
  \`\`\`
  respond in html format only refering to the articles you can find in the JSON array
  including the link to the article.
  Include the release date of the article.`;
  // First step: Generate marketing copy
  const { text } = await generateText({
    model: "openai/gpt-4.1-nano",
    maxOutputTokens: 32000,
    system: changelogInstructions,
    prompt: prompt,
  });
  return text;
}

export {
  askChangelogAI,
  getRefinedArticles,
  type RefinedArticle as RefinedArticle,
};
