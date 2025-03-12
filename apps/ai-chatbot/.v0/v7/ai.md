I understand that you're encountering an error with the `ai/streams` import. Let's update the code to resolve this issue and make sure we're using the correct imports from the AI SDK. I'll modify the `app/api/chat/route.ts` file to use the correct imports and structure.

<ReactProject id="AI Text Generator">

```tsx file="app/api/chat/route.ts"
import { StreamingTextResponse, OpenAIStream } from "ai";
import OpenAI from "openai";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
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

This updated code uses the correct imports from the `ai` package and the latest `openai` package. The `OpenAIStream` is now imported directly from `ai`, and we're using the new `OpenAI` class from the `openai` package.

Now, let's update the `app/page.tsx` file to ensure it's using the correct imports and structure:

```tsx file="app/page.tsx"
"use client";

import React, { useState } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TextGenerator() {
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
      await handleSubmit(e);
    } catch (error) {
      console.error("Submission error:", error);
      setError("Failed to submit the request. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Text Generator</h1>

      <form onSubmit={handleTextPromptSubmit} className="mb-4">
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
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
          <div key={m.id} className="rounded border p-4">
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

These changes should resolve the import error and ensure that your AI Text Generator is working correctly with the latest versions of the AI SDK and OpenAI package.

</ReactProject>

To complete the setup, make sure you have the following dependencies installed in your `package.json`:

```json
{
  "dependencies": {
    "ai": "^2.2.31",
    "openai": "^4.24.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4"
  }
}
```

You can install these dependencies by running:

```bash
npm install ai openai@^4.24.1
```

This should resolve the "Module not found: Can't resolve 'ai/streams'" error and update your project to use the latest AI SDK and OpenAI package.
