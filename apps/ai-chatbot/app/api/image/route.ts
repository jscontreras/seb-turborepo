import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  try {
    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: prompt,
    });

    // The image.base64 is already the base64 encoded string
    return Response.json({
      imageData: `data:image/png;base64,${image.base64}`,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
