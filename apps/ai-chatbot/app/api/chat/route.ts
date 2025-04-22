import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

// Echo function
async function echo({ message }: { message: string }) {
  const serverTime = new Date().toISOString();
  return `${message} (server time: ${serverTime})`;
}

// Define the tool config
const tools = {
  echo: tool({
    description: "Echo message with server timestamp",
    parameters: z.object({
      message: z.string().describe("The message word or sentence to echo"),
    }),
    execute: echo,
  }),
};

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
    : "You are a helpful assistant that can echo messages with a timestamp. Use the echo tool when asked to echo something.";

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 3, // Allow multiple steps for tool calling and response
  });

  return result.toDataStreamResponse();
}
