import { generateText } from "ai";
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
import { NextResponse } from "next/server";

// Allow responses up to 5 minutes
export const maxDuration = 300;

function createChangelogInstructions(
  sources: string[],
  rangeObject: z.infer<typeof ZodrangeDetectorSchema>,
) {
  return `You are a changelog agent that answers questions about Vercel's official documentation.
   As part of the context to use tools, you have the following range object: ${JSON.stringify(rangeObject)}.

   IMPORTANT: You MUST use the getChangelogs tool first to answer the user's question. Do not answer without calling this tool.

   ${
     sources.length > 1
       ? "Use the getChangelogs tool to answer the question."
       : `After calling getChangelogs, use the result from getChangelogs (not the user prompt) and the range object to call the getBlogs, getGuides, or getDocs tools to get extra references.`
   }
  `;
}

/**
 * POST request handler for the changelog tool API
 * Accepts a single prompt and returns a complete response with changelog updates
 * and any guides/docs/blogs available.
 *
 * This endpoint is designed for external tool integration (e.g., from other systems).
 * Unlike the streaming chat endpoint, this returns a complete JSON response.
 *
 * Request body:
 * {
 *   "prompt": "What are the latest Vercel features from the last month?"
 * }
 *
 * Response:
 * {
 *   "answer": "The final answer from the agent...",
 *   "changelog": "Changelog extract in markdown format...",
 *   "blogs": "Blog references in markdown format...",
 *   "guides": "Guide references in markdown format...",
 *   "docs": "Documentation references in markdown format...",
 *   "sources": ["changelog", "blogs", "guides"],
 *   "dateRange": { "isRangeInPrompt": true, "startDate": "...", "endDate": "..." }
 * }
 *
 * @param req - The request object containing { prompt: string }
 * @returns JSON response with answer and references
 */
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 },
      );
    }

    // Detect the range of the user message and determine sources in parallel
    let rangeObject: z.infer<typeof ZodrangeDetectorSchema> = {
      isRangeInPrompt: false,
      startDate: null,
      endDate: null,
      currentDate: new Date().toISOString(),
    };

    // Run independent operations in parallel for better performance
    const [rangedPrompt, detectedSources] = await Promise.all([
      rewriteRelativeDates(prompt),
      determineSources(prompt),
    ]);

    // Detect range if dates were rewritten
    if (rangedPrompt !== prompt) {
      const rangeObjectResponse = await detectRange(rangedPrompt);
      console.log("rangeObjectResponse", rangeObjectResponse);
      rangeObject = rangeObjectResponse;
    }

    const sources: string[] =
      detectedSources.length > 0 ? detectedSources : ["changelog"];
    console.log(">>>sources", sources);

    // Get the tools
    const tools = getVercelPerplexityTools(null);

    // Execute the agent with tools
    // Use NANO_MODEL for faster response - it's sufficient for tool orchestration
    // Force the agent to call getChangelogs first, then use the result
    // to call getBlogs/getGuides/getDocs if needed
    const result = await generateText({
      model: gateway(process.env.NANO_MODEL || "gpt-4.1-mini"),
      system: createChangelogInstructions(sources, rangeObject),
      prompt: `You MUST use the getChangelogs tool to answer this question: ${prompt}`,
      tools: tools,
      toolChoice: "auto",
      maxOutputTokens: 4000, // Limit output for faster generation
    });

    // Extract tool results from the response
    const toolResults: Record<string, string> = {};
    const responseText = result.text;

    // Parse tool results from all steps
    if (result.steps) {
      for (const step of result.steps) {
        // Extract tool results from each step
        if (step.toolResults) {
          for (const toolResult of step.toolResults) {
            const toolName = toolResult.toolName;
            // Tool results use 'output' property, not 'result'
            const toolOutput = (toolResult as any).output || (toolResult as any).result;

            // Handle both string results and object results with text property
            // getChangelogs now returns a string (after our fix)
            let resultValue: string;
            if (typeof toolOutput === "string") {
              resultValue = toolOutput;
            } else if (toolOutput && typeof toolOutput === "object") {
              // Check for GenerateTextResult structure
              if ("text" in toolOutput) {
                resultValue = (toolOutput as { text: string }).text;
              } else if ("steps" in toolOutput) {
                // Handle nested steps structure (like in streaming)
                const steps = (toolOutput as any).steps;
                resultValue = steps
                  .map((step: any) =>
                    step.content?.map((content: any) => content.text).join("\n") || ""
                  )
                  .join("\n");
              } else {
                // Fallback: try to stringify
                resultValue = JSON.stringify(toolOutput);
              }
            } else if (toolOutput === undefined || toolOutput === null) {
              resultValue = "";
            } else {
              resultValue = String(toolOutput);
            }

            if (toolName === "getChangelogs") {
              toolResults.changelog = resultValue;
            } else if (toolName === "getBlogs") {
              toolResults.blogs = resultValue;
            } else if (toolName === "getGuides") {
              toolResults.guides = resultValue;
            } else if (toolName === "getDocs") {
              toolResults.docs = resultValue;
            }
          }
        }
      }
    }

    // Also check top-level toolResults if they exist
    if (result.toolResults) {
      for (const toolResult of result.toolResults) {
        const toolName = toolResult.toolName;
        // Tool results use 'output' property, not 'result'
        const toolOutput = (toolResult as any).output || (toolResult as any).result;
        let resultValue: string;
        if (typeof toolOutput === "string") {
          resultValue = toolOutput;
        } else if (toolOutput && typeof toolOutput === "object" && "text" in toolOutput) {
          resultValue = (toolOutput as { text: string }).text;
        } else {
          resultValue = String(toolOutput || "");
        }

        if (toolName === "getChangelogs" && !toolResults.changelog) {
          toolResults.changelog = resultValue;
        } else if (toolName === "getBlogs" && !toolResults.blogs) {
          toolResults.blogs = resultValue;
        } else if (toolName === "getGuides" && !toolResults.guides) {
          toolResults.guides = resultValue;
        } else if (toolName === "getDocs" && !toolResults.docs) {
          toolResults.docs = resultValue;
        }
      }
    }

    // Return the complete response
    return NextResponse.json({
      answer: responseText,
      changelog: toolResults.changelog || null,
      blogs: toolResults.blogs || null,
      guides: toolResults.guides || null,
      docs: toolResults.docs || null,
      sources: sources,
      dateRange: rangeObject,
    });
  } catch (error) {
    console.error("Error in changelog tool API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
