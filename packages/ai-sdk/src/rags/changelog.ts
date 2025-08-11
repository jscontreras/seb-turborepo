import { put } from "@vercel/blob";
import TurndownService from "turndown";
import Browserbase from "@browserbasehq/sdk";
import { chromium } from "playwright-core";
import { ElementHandleForTag } from "playwright-core/types/structs";

type Article = {
  title: string;
  htmlContent: string;
  markdownContent: string;
  link: string;
  launchDate: string;
  timestamp: number;
};

export type { Article };

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY || "",
});

async function isArticleInBlob(
  firstArticleNode: ElementHandleForTag<"article"> | undefined,
  currentArticles: any[],
) {
  if (!firstArticleNode) {
    return true;
  }
  const firstArticleLink = await firstArticleNode.$eval(
    "a",
    (node) => node.href,
  );
  return currentArticles.some(
    (currentArticle) => currentArticle.link === firstArticleLink,
  );
}

async function getVercelChangelogFromWebsite(size: number = 10) {
  // Create a new session
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID || "",
  });
  // Connect to the session
  const browser = await chromium.connectOverCDP(session.connectUrl);

  // Getting the default context to ensure the sessions are recorded.
  const defaultContext = browser.contexts()[0];
  if (!defaultContext) {
    throw new Error("No default context found");
  }
  const page = defaultContext.pages()[0];
  if (!page) {
    throw new Error("No page found");
  }
  const currentArticles: Article[] = await getVercelChangelogFromBlob();

  console.log("Updating Vercel Changelog", size);
  const url = "https://vercel.com/changelog";
  await page.goto(url);
  await page.waitForTimeout(4000);
  // get all the article nodes
  let articleNodes = await page.$$("article");
  let firstArticleNode = articleNodes[0];
  let pointer = 0;
  let isFirstArticleInBlob = await isArticleInBlob(
    firstArticleNode,
    currentArticles,
  );
  // if the first article is in the blob, we don't need to load more articles
  while (articleNodes.length < size && !isFirstArticleInBlob) {
    const showMoreButton = await page.$('button:has-text("Show More")');
    if (showMoreButton) {
      pointer = articleNodes.length;
      await showMoreButton.click();
      await page.waitForTimeout(4000); // wait for more articles to load
      articleNodes = await page.$$("article");
    } else {
      break; // Exit the loop if no "Show More" button is found
    }
    console.log("Total article nodes on the page:", articleNodes.length);
    isFirstArticleInBlob = await isArticleInBlob(
      articleNodes[pointer],
      currentArticles,
    );
  }
  const articles: {
    title: string;
    htmlContent: string;
    markdownContent: string;
    link: string;
    launchDate: string;
    timestamp: number;
  }[] = [];

  for (let i = 0; i < Math.min(size, articleNodes.length) && i < size; i++) {
    const articleNode = articleNodes[i];
    if (!articleNode) {
      throw new Error("Article node is undefined");
    }
    const title = await articleNode.$eval("h2", (node) => node.innerText);
    const link = await articleNode.$eval("a", (node) => node.href);
    const htmlContent = await articleNode.evaluate(
      (node: HTMLElement) => node.innerHTML,
    );
    const launchDate = await articleNode.$eval(
      'time[class^="date-pill-module"]',
      (node) => node.getAttribute("datetime") || "",
    );

    let markdownContent;
    try {
      const turndownService = new TurndownService();
      markdownContent = turndownService.turndown(htmlContent);
    } catch (error) {
      console.error("Error converting HTML to Markdown:", error);
      markdownContent = "";
    }
    // also store timestamp in milliseconds based on launchDate
    const timestamp = new Date(launchDate).getTime();

    // Check if the article is already stored in the blob
    const exists = currentArticles.some(
      (currentArticle) => currentArticle.link === link,
    );
    if (exists) {
      break; // Stop the loop if the article is already stored
    }
    articles.push({
      title,
      htmlContent,
      markdownContent,
      link,
      launchDate,
      timestamp,
    });
  }

  browser.close();
  return articles;
}

async function updateVercelChangelog(size: number = 10) {
  const articles = await getVercelChangelogFromWebsite(size);
  if (articles.length === 0) {
    return { status: "OK", message: "nothing to update" };
  }
  articles.sort((a, b) => b.timestamp - a.timestamp);
  const currentArticles: Article[] = await getVercelChangelogFromBlob();
  const mergedArticles = [...currentArticles];
  const newArticles: Article[] = [];

  for (const newArticle of articles) {
    const exists = currentArticles.some(
      (currentArticle) => currentArticle.link === newArticle.link,
    );
    if (!exists) {
      mergedArticles.push(newArticle);
      newArticles.push(newArticle);
    }
  }
  // sort the merged articles by timestamp from newest to oldest
  mergedArticles.sort((a, b) => b.timestamp - a.timestamp);
  const maxUpdates = 150;
  const limitedArticles = mergedArticles.slice(0, maxUpdates);
  const blob = await put(
    "changelog/vercel-changelog.json",
    JSON.stringify(limitedArticles, null, 2),
    {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    },
  );
  return {
    status: "OK",
    message: "updated",
    blob: blob.url,
    articles: limitedArticles.length,
    numberOfAddedArticles: newArticles.length,
  };
}

// create a function to get the vercel changelog from the blob
async function getVercelChangelogFromBlob(): Promise<Article[]> {
  const response = await fetch(
    "https://xefbf5ydcrobj1vo.public.blob.vercel-storage.com/changelog/vercel-changelog.json",
  );
  const articles = await response.json();
  return articles;
}

export { getVercelChangelogFromBlob, updateVercelChangelog };
