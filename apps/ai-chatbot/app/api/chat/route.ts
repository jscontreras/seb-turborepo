import { createImageTool } from "@/lib/ai/tools/createImage";
import { echoTool } from "@/lib/ai/tools/echo";
import { modifyImageTool } from "@/lib/ai/tools/modifyImage";
import { sumTool } from "@/lib/ai/tools/sum";
import { openai } from "@ai-sdk/openai";
import { streamText, Tool } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Extract the last message to check if we need to continue after a tool call
  const lastMessage = messages[messages.length - 1];

  // If the last message is from the assistant and has tool calls but no content,
  // we need to continue the conversation with the tool results
  const shouldContinue =
    lastMessage?.role === "assistant" &&
    lastMessage?.toolInvocations?.length > 0 &&
    (!lastMessage.content || lastMessage.content.trim() === "");

  // If we're continuing after a tool call, add a system message to instruct the model
  const systemPrompt = shouldContinue
    ? "You received the result of the tool call. Now respond to the user with the information from the tool result."
    : "You are a helpful assistant that can use tools. Use the corresponding tool when asked to echo something.";

  const providedTools = {
    echo: echoTool,
    sum: sumTool,
    createImage: createImageTool,
    modifyImage: modifyImageTool,
  };

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    tools: providedTools as Record<string, Tool>,

    experimental_repairToolCall: async ({ toolCall }) => {
      const tool =
        providedTools[toolCall.toolName as keyof typeof providedTools];
      const repairedArgs = tool.fixArgs
        ? tool.fixArgs(toolCall)
        : toolCall.args;
      return { ...toolCall, args: JSON.stringify(repairedArgs) };
    },
    maxSteps: 10, // Allow multiple steps for tool calling and response
  });

  return result.toDataStreamResponse();
}
