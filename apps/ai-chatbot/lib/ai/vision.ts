"use server";

import OpenAI from "openai";

export async function analyzeImage(image: string, question: string) {
  if (!image) {
    throw new Error("Image is required");
  }

  if (!question) {
    throw new Error("Question is required");
  }

  try {
    // Ensure the image is properly formatted as a base64-encoded data URL
    if (!image.startsWith("data:image/")) {
      throw new Error("Invalid image format. Please upload a valid image.");
    }

    // Initialize the OpenAI client - do this inside the function to ensure it's server-side only
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY_PERSONAL,
    });

    console.log("Processing image and question:", {
      questionLength: question.length,
      imagePrefix: image.substring(0, 50) + "...",
    });
    const response = await openai.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are an AI assistant that can see and analyze images. Provide detailed, accurate, and helpful responses to questions about the image.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: question,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Conceptually, the image portrays an anthropomorphic scenario blending nature and urban culture. It features a realistic-looking dog, likely a coyote or wolf, sitting upright in a narrow urban alleyway and playing an acoustic guitar like a human street performer. The background showcases tall, brick buildings closely aligned, suggesting a dense, city environment. Additional musical items—a harmonica and a second smaller string instrument, perhaps a ukulele or mandolin—are placed nearby on the ground, reinforcing the musical and performative theme.\n\nThe juxtaposition of a wild animal in a distinctly human setting evokes themes of urban wilderness, adaptation, and the blending of natural and civilized worlds. The dog’s human-like behavior—playing an instrument—adds a surreal, whimsical quality while suggesting commentary on humanization of animals or the innate expressiveness of music that transcends species. The image also touches on ideas of solitude, resilience, and street artistry, making it a rich conceptual piece combining fantasy, realism, and subtle social cues.",
            },
          ],
        },
      ],
      response_format: {
        type: "text",
      },
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      store: false,
    });

    // Extract the response text
    const responseText =
      response.choices[0]?.message?.content || "No response generated.";
    return responseText;
  } catch (error: any) {
    console.error("Error in analyzeImage:", error);

    // Handle specific errors
    if (
      error.message?.includes("quota") ||
      error.message?.includes("billing")
    ) {
      throw new Error(
        "OpenAI API quota exceeded. Please check your billing details at platform.openai.com/account/billing.",
      );
    } else if (error.message?.includes("deprecated")) {
      throw new Error(
        "The AI model being used is deprecated. Please contact the developer to update the application.",
      );
    } else {
      throw new Error(`Failed to analyze the image: ${error.message}`);
    }
  }
}
