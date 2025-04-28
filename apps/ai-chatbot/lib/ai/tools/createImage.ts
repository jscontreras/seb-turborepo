import { z } from "zod";
import OpenAI from "openai";
import { CustomTool } from "./tool";

// Echo function
async function toolExec({ prompt }: { prompt: string }) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_PERSONAL,
    });
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024", // Specify smaller image resolution
    });

    if (result.data && result.data.length > 0) {
      return result?.data[0]?.url;
    }
  } catch (error) {
    console.error("Image generation error:", error);
    return null as string | null;
  }
}

// Define the tool config
export const createImageTool: CustomTool = {
  description: "Generate create an image based on prompt",
  parameters: z.object({
    prompt: z
      .string()
      .describe("The prompt or description of the image to generate"),
  }),
  execute: toolExec,
};
