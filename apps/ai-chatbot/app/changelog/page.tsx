import { Metadata } from "next";
import { ChatBot } from "./components/chatBot";

/**
 * @description Generate metadata for the page
 * @returns Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Vercel Changelog Bot', // Dynamic title based on fetched product data
    description: 'AI Bot (Vercel Changelog RAG)',
  }
}

export default function Page() {
  return (
    <div className="vercel-changelog-chatbot">
      <ChatBot />
    </div>
  );
}
