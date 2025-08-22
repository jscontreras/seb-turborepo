import { Metadata } from "next";
import { ChatBot } from "./components/chatBot";

/**
 * @description Generate metadata for the page
 * @returns Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Vercel Changelog Bot", // Dynamic title based on fetched product data
    description: "AI Bot (Vercel Changelog RAG)",
  };
}

export default function Page() {
  const nanoModel = process.env.NANO_MODEL || "Nano Model";
  const miniModel = process.env.MINI_MODEL || "Mini Model";
  return (
    <div className="vercel-changelog-chatbot flex-1 min-h-0 flex flex-col">
      <ChatBot nanoModel={nanoModel} miniModel={miniModel} />
    </div>
  );
}
