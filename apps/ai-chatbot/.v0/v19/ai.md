I'll create a new page `/image-chatbot` that uses the same OpenAI key but returns an image instead of text. I'll use the Vercel AI SDK for this implementation. Here's how we'll structure this:

1. Create a new API route for image generation
2. Create a new page for the image chatbot
3. Update the layout to include navigation between pages

Let's start with the implementation:

<ReactProject id="Image Chatbot">

First, let's create a new API route for image generation:

```tsx file="app/api/image/route.ts"
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    return Response.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
```

Now, let's create the new page for the image chatbot:

```tsx file="app/image-chatbot/page.tsx"
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error("Image generation error:", error);
      setError(
        "An error occurred while generating the image. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Image Generator</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <Input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your image prompt..."
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

      {imageUrl && (
        <div className="mt-4">
          <img
            src={imageUrl}
            alt="Generated image"
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
```

Now, let's update the layout to include navigation between pages:

```tsx file="app/layout.tsx"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Generator",
  description: "Generate text and images with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-primary p-4 text-primary-foreground">
          <div className="mx-auto flex max-w-2xl justify-between">
            <Link href="/" className="font-bold">
              AI Generator
            </Link>
            <div className="space-x-4">
              <Link href="/" className="hover:underline">
                Text
              </Link>
              <Link href="/image-chatbot" className="hover:underline">
                Image
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

Finally, let's update the main page to match the styling of the image chatbot page:

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

</ReactProject>

These changes create a new `/image-chatbot` page that uses the same OpenAI key to generate images instead of text. The UI is consistent with the existing text generation page, and I've added navigation to switch between the two pages.

Here's a summary of the changes:

1. Created a new API route `app/api/image/route.ts` for image generation using the OpenAI API.
2. Created a new page `app/image-chatbot/page.tsx` for the image generation UI.
3. Updated `app/layout.tsx` to include navigation between the text and image generation pages.
4. Updated `app/page.tsx` to match the styling of the new image generation page.

The image generation doesn't use streaming on the client side, as requested. Instead, it waits for the full response from the API before displaying the generated image.
