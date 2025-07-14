I'll modify the `page.tsx` and the API endpoint to work with the Vercel SDK, assuming that the `OPENAI_API_KEY` has already been provided. I'll make sure to follow the additional rules you've mentioned.

<ReactProject id="AI Image Generator">

Let's start by updating the API endpoint:

```tsx file="app/api/chat/route.ts"
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    stream: true,
    messages: messages.map((message: any) => ({
      content: message.content,
      role: message.role,
    })),
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
```

Now, let's update the `page.tsx` file:

```tsx file="app/page.tsx"
"use client";

import React, { useState } from "react";
import { useChat } from "ai/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImageGenerator() {
  const [imagePrompt, setImagePrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      onError: (error) => {
        console.error("Chat error:", error);
        setError(
          "An error occurred while generating the image. Please try again.",
        );
      },
    });

  const handleImagePromptSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError(null);
    setGeneratedImage(null);
    try {
      await handleSubmit(e, {
        options: {
          body: { content: `Generate an image of: ${imagePrompt}` },
        },
      });
      setImagePrompt(""); // Clear the input after submission
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit the request. Please try again.");
    }
  };

  // Process the messages to extract the generated image URL
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      const imageUrlMatch = lastMessage.content.match(/https:\/\/+/);
      if (imageUrlMatch) {
        setGeneratedImage(imageUrlMatch[0]);
      }
    }
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Image Generator</h1>

      <form onSubmit={handleImagePromptSubmit} className="mb-4">
        <Input
          type="text"
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="mb-2"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Image"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="p-4 border rounded">
            {m.role === "user" ? (
              <p className="font-semibold">{m.content}</p>
            ) : m.role === "assistant" ? (
              <div>
                <p className="mb-2">{m.content}</p>
              </div>
            ) : null}
          </div>
        ))}
        {generatedImage && (
          <div className="p-4 border rounded">
            <p className="mb-2 font-semibold">Generated Image:</p>
            <Image
              src={generatedImage}
              alt="Generated image"
              width={512}
              height={512}
              className="rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

</ReactProject>

In these updates, I've made the following changes:

1. In the API route (`app/api/chat/route.ts`):
   - Imported necessary functions from the Vercel AI SDK.
   - Set up the OpenAI configuration using the provided `OPENAI_API_KEY`.
   - Updated the POST function to use the Vercel AI SDK for streaming responses.
   - Set the runtime to 'edge' for better performance.

2. In the page component (`app/page.tsx`):
   - Updated the `handleImagePromptSubmit` function to work with the new API.
   - Added a `generatedImage` state to store the URL of the generated image.
   - Added a `useEffect` hook to process the messages and extract the image URL.
   - Updated the rendering logic to display the generated image when available.

These changes should make the application work with the Vercel SDK and the provided `OPENAI_API_KEY`. The image generation is now handled through the chat completion, where the assistant is expected to return an image URL in its response.

Note that this implementation assumes that the OpenAI model will return an image URL in its response. You may need to adjust the prompt or use a different model that supports image generation if this is not the case.
