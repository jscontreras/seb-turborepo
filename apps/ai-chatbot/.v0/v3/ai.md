I'll modify the app to return text instead of an image. We'll need to update the `app/page.tsx` file and the `app/api/chat/route.ts` file. Let's make these changes:

<ReactProject id="Text Generator">

First, let's update the `app/api/chat/route.ts` file:

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
    model: "gpt-3.5-turbo",
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

Now, let's update the `app/page.tsx` file:

```tsx file="app/page.tsx"
"use client";

import React, { useState } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TextGenerator() {
  const [textPrompt, setTextPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      onError: (error) => {
        console.error("Chat error:", error);
        setError(
          "An error occurred while generating the text. Please try again.",
        );
      },
    });

  const handleTextPromptSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError(null);
    try {
      await handleSubmit(e, {
        options: {
          body: { content: textPrompt },
        },
      });
      setTextPrompt(""); // Clear the input after submission
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit the request. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Text Generator</h1>

      <form onSubmit={handleTextPromptSubmit} className="mb-4">
        <Input
          type="text"
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="mb-2"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Text"}
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
      </div>
    </div>
  );
}
```

</ReactProject>

These changes modify the app to generate text instead of images. Here's a summary of the modifications:

1. In `app/api/chat/route.ts`:

   - We changed the model from "gpt-4" to "gpt-3.5-turbo" for text generation.
   - We removed any image-specific logic as we're now focusing on text generation.

2. In `app/page.tsx`:

   - We renamed the component from `ImageGenerator` to `TextGenerator`.
   - We replaced `imagePrompt` with `textPrompt`.
   - We removed all image-related state and logic.
   - We updated the UI to reflect that we're generating text instead of images.
   - We removed the `Image` component import and usage.

3. The chat functionality remains largely the same, but now it's used for text generation instead of image generation.

4. The UI has been simplified to focus on text input and output.

These changes transform the app from an image generator to a text generator while maintaining the chat-like interface and error handling. Users can now enter prompts and receive text responses from the AI model.
