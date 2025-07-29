import { convertToModelMessages, streamText } from "ai";
import {
  determineSources,
  getVercelPerplexityTools,
} from "@repo/ai-sdk/agents/changelog";
import { gateway } from "@ai-sdk/gateway";
import {
  detectRange,
  rewriteRelativeDates,
  ZodrangeDetectorSchema,
} from "@repo/ai-sdk/agents/rangeDetector";
import { z } from "zod";

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;
let latestChangelogResponse: string | null = null;

function createChangelogInstructions(
  sources: string[],
  rangeObject: z.infer<typeof ZodrangeDetectorSchema>,
) {
  return `You are a changelog agent that answers questions about Vercel's official documentation.
   As part of the context to use tools, you have the following range object: ${JSON.stringify(rangeObject)}.
   ${
     sources.length > 1
       ? "Use the getChangelogs to answer the question."
       : `Using the result from the getChangelogs tool (not the user prompt) and the range object, use the getBlogs, getGuides, or getDocs tools to get extra references.`
   }
  `;
}

/**
 * POST request handler for the changelog API
 * @param req - The request object
 * @returns The response object
 */
export async function POST(req: Request) {
  try {
    const { messages, trigger } = await req.json();
    const message = messages[messages.length - 1];

    // Detect the range of the user message
    let rangeObject = null;
    // The last user message
    let lastUserMessage = null;
    // Determine the sources to search the web for
    let sources: string[] = ["changelog"];

    if (trigger === "submit-message") {
      lastUserMessage = message.parts
        .filter((part: { type: string }) => part.type === "text")
        .map((part: { text: any }) => part.text)
        .join("");
    }
    if (!latestChangelogResponse) {
      const changelogResponse = messages
        .filter((msg: { role: string }) => msg.role === "assistant")
        .map((assistantMessage: { parts: any }) =>
          assistantMessage.parts.filter(
            (part: { type: string; state: string }) =>
              part.type === "tool-getChangelogs" &&
              part.state === "output-available",
          ),
        )
        .flat()
        .pop();

      if (changelogResponse) {
        latestChangelogResponse = changelogResponse.output.steps
          .map((step: any) =>
            step.content.map((content: any) => content.text).join("\n"),
          )
          .join("\n");
      }
    }
    if (lastUserMessage) {
      let rangedPrompt = await rewriteRelativeDates(lastUserMessage);
      // If dates are found
      if (rangedPrompt !== lastUserMessage) {
        const rangeObjectResponse = await detectRange(rangedPrompt);
        console.log("rangeObjectResponse", rangeObjectResponse);
        rangeObject = rangeObjectResponse;
      }
    }
    const detectedSources = await determineSources(lastUserMessage);
    sources = detectedSources.length > 0 ? detectedSources : sources;
    console.log(">>>sources", sources);
    const result = streamText({
      model: gateway("gpt-4.1-mini"),
      system: createChangelogInstructions(
        sources,
        rangeObject || {
          isRangeInPrompt: false,
          startDate: null,
          endDate: null,
          currentDate: new Date().toISOString(),
        },
      ),
      messages: convertToModelMessages(messages),
      tools: {
        ...getVercelPerplexityTools(latestChangelogResponse),
      },
      toolChoice: "auto",
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in streamText:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorType = "generation";

    // Return an error response that the UI can handle
    return new Response(
      JSON.stringify({
        error: errorMessage,
        errorType: errorType,
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
