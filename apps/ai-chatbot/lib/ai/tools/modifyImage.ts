import { z } from "zod";
import OpenAI from "openai";
import sharp from "sharp";
import { CustomTool } from "./tool";

async function toolExec(
  { prompt, url }: { prompt: string; url: string },
  { messages }: { messages: Array<any> },
) {
  try {
    const lastMessage = messages.pop();
    let specUrl = url;
    if (lastMessage?.role == "user") {
      (lastMessage.content as Array<any>).forEach((part) => {
        if (part?.type && part.type == "image") {
          specUrl = part?.image.href || "";
          console.log("specUrl<<<REPLACED>>>>", specUrl);
        }
      });
    }
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_PERSONAL,
    });
    // Download the image from the URL
    const imageResponse = await fetch(specUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to fetch image from URL: ${imageResponse.statusText}`,
      );
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Process the image to ensure it meets DALL-E requirements
    // DALL-E 2 requires square PNG images
    const processedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(1024, 1024, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFormat("png")
      .toBuffer();

    // Generate a mask image (e.g., a fully transparent image with the same dimensions)
    const maskBuffer = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fully transparent
      },
    })
      .png()
      .toBuffer();

    // Convert buffers to File objects for OpenAI API
    const imageFile = new File([processedImageBuffer], "image.png", {
      type: "image/png",
    });
    const maskFile = new File([maskBuffer], "mask.png", { type: "image/png" });

    // Call OpenAI API to edit the image
    const responseAi = await openai.images.edit({
      model: "dall-e-2",
      image: imageFile,
      mask: maskFile,
      prompt,
      n: 1,
      size: "1024x1024",
    });
    if (responseAi.data && responseAi.data.length > 0) {
      return responseAi.data[0].url;
    }
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

export const modifyImageTool: CustomTool = {
  description: "Modify an image based on a prompt text and base64 image",
  parameters: z.object({
    prompt: z
      .string()
      .describe("The prompt that describes the image modification"),
    url: z.string().describe("Url of the original image"),
  }),
  execute: toolExec,
  fixArgs: (toolCall) => {
    console.log(">>>>>>>>>>>>>", toolCall);
    return toolCall.args;
  },
};
