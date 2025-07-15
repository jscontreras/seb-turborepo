import { createImageTool } from "@/lib/ai/tools/createImage";
import { echoTool } from "@/lib/ai/tools/echo";
import { modifyImageTool } from "@/lib/ai/tools/modifyImage";
import { sumTool } from "@/lib/ai/tools/sum";
import { convertToModelMessages, streamText, Tool } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const providedTools = {
    echo: echoTool,
    sum: sumTool,
    createImage: createImageTool,
    modifyImage: modifyImageTool,
  };

  const result = streamText({
    model: openai("gpt-4.1-nano"),
    maxOutputTokens: 32000,
    messages: convertToModelMessages(messages),
    tools: providedTools as Record<string, Tool>,
  });

  return result.toUIMessageStreamResponse();
}
